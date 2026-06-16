import "server-only";

import { getCachedValue, getGitHubCacheKey, setCachedValue, GITHUB_CACHE_TTL_SECONDS } from "./cache";
import { executeGitHubGraphQL } from "./client";
import { GitHubNotFoundError } from "./errors";
import { GITHUB_ACTIVITY_QUERY } from "./queries";
import {
  gitHubSchemas,
  type GitHubCommitSummary,
  type GitHubContributionCalendar,
  type GitHubContributionSummary,
  type GitHubConsistencyScore,
  type GitHubUserResponse,
} from "./types";

const CONTRIBUTION_WINDOW_DAYS = 365;

type GitHubActivity = {
  username: string;
  displayName: string | null;
  from: string;
  to: string;
  totalContributions: number;
  totalCommitContributions: number;
  contributionCalendar: GitHubContributionCalendar;
  activeDays: number;
  activeWeeks: number;
  currentStreakDays: number;
};

function getContributionWindow() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - (CONTRIBUTION_WINDOW_DAYS - 1));

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function flattenContributionDays(calendar: GitHubContributionCalendar) {
  return calendar.weeks.flatMap((week) => week.contributionDays);
}

function countActiveDays(calendar: GitHubContributionCalendar) {
  return flattenContributionDays(calendar).filter((day) => day.contributionCount > 0).length;
}

function countActiveWeeks(calendar: GitHubContributionCalendar) {
  return calendar.weeks.filter((week) => week.contributionDays.some((day) => day.contributionCount > 0)).length;
}

function calculateCurrentStreak(calendar: GitHubContributionCalendar) {
  const days = [...flattenContributionDays(calendar)].sort((a, b) => a.date.localeCompare(b.date));
  const dayMap = new Map(days.map((day) => [day.date, day.contributionCount]));

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  for (let offset = 0; offset < days.length; offset += 1) {
    const isoDate = cursor.toISOString().slice(0, 10);
    const contributionCount = dayMap.get(isoDate) ?? 0;

    if (contributionCount > 0) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

function buildGitHubActivity(
  data: GitHubUserResponse,
  username: string,
  window = getContributionWindow(),
): GitHubActivity {
  if (!data.user) {
    throw new GitHubNotFoundError(username);
  }

  const profile = gitHubSchemas.gitHubUserSchema.parse(data.user);
  const calendar = profile.contributionsCollection.contributionCalendar;

  return {
    username: profile.login,
    displayName: profile.name ?? null,
    from: window.from,
    to: window.to,
    totalContributions: profile.contributionsCollection.totalContributions,
    totalCommitContributions: profile.contributionsCollection.totalCommitContributions,
    contributionCalendar: calendar,
    activeDays: countActiveDays(calendar),
    activeWeeks: countActiveWeeks(calendar),
    currentStreakDays: calculateCurrentStreak(calendar),
  };
}

async function getOrCreateCachedActivity(username: string): Promise<GitHubActivity> {
  const cacheKey = getGitHubCacheKey("activity", username, "365d");
  const cached = await getCachedValue<GitHubActivity>(cacheKey);
  if (cached) {
    return cached;
  }

  const { from, to } = getContributionWindow();
  const data = await executeGitHubGraphQL<GitHubUserResponse>({
    operationName: "GitHubActivity",
    query: GITHUB_ACTIVITY_QUERY,
    variables: {
      login: username,
      from,
      to,
    },
  });

  const activity = buildGitHubActivity(data, username, { from, to });
  await setCachedValue(cacheKey, activity, GITHUB_CACHE_TTL_SECONDS);
  return activity;
}

function labelConsistencyScore(score: number): GitHubConsistencyScore["label"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  return "Needs consistency";
}

function calculateConsistencyScore(activity: GitHubActivity): GitHubConsistencyScore {
  const totalWeeks = activity.contributionCalendar.weeks.length || 1;
  const activeWeekRatio = activity.activeWeeks / totalWeeks;
  const averageDailyContributions = activity.totalContributions / CONTRIBUTION_WINDOW_DAYS;
  const volumeScore = Math.min(100, Math.round((averageDailyContributions / 4) * 100));
  const activityScore = Math.min(100, Math.round(activeWeekRatio * 100));
  const streakScore = Math.min(100, Math.round((activity.currentStreakDays / 21) * 100));
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(activityScore * 0.45 + volumeScore * 0.35 + streakScore * 0.2),
    ),
  );

  return {
    username: activity.username,
    score,
    label: labelConsistencyScore(score),
    breakdown: {
      activity: activityScore,
      volume: volumeScore,
      streak: streakScore,
    },
    activeDays: activity.activeDays,
    activeWeeks: activity.activeWeeks,
    currentStreakDays: activity.currentStreakDays,
  };
}

export async function getContributions(username: string): Promise<GitHubContributionSummary> {
  const activity = await getOrCreateCachedActivity(username);

  return {
    username: activity.username,
    displayName: activity.displayName,
    from: activity.from,
    to: activity.to,
    totalContributions: activity.totalContributions,
    totalCommitContributions: activity.totalCommitContributions,
    activeDays: activity.activeDays,
    activeWeeks: activity.activeWeeks,
    currentStreakDays: activity.currentStreakDays,
    contributionCalendar: activity.contributionCalendar,
  };
}

export async function getCommits(username: string): Promise<GitHubCommitSummary> {
  const activity = await getOrCreateCachedActivity(username);
  const weeks = activity.contributionCalendar.weeks;
  const recentWeeklyCommits = weeks.slice(-12).map((week) => ({
    weekStart: week.firstDay,
    commits: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
  }));

  return {
    username: activity.username,
    totalCommits: activity.totalCommitContributions,
    averageCommitsPerActiveWeek:
      activity.activeWeeks > 0 ? activity.totalCommitContributions / activity.activeWeeks : 0,
    averageCommitsPerDay: activity.totalCommitContributions / CONTRIBUTION_WINDOW_DAYS,
    activeDays: activity.activeDays,
    activeWeeks: activity.activeWeeks,
    recentWeeklyCommits,
  };
}

export async function getConsistencyScore(username: string): Promise<GitHubConsistencyScore> {
  const activity = await getOrCreateCachedActivity(username);
  return calculateConsistencyScore(activity);
}
