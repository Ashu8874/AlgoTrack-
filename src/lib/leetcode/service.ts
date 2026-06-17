import "server-only";

import { executeLeetCodeGraphQL, LeetCodeNotFoundError } from "./client";
import {
  getCachedValue,
  getLeetCodeCacheKey,
  setCachedValue,
  LEETCODE_CACHE_TTL_SECONDS,
} from "./cache";
import {
  CONTEST_INFO_QUERY,
  DASHBOARD_QUERY,
  DAILY_CHALLENGE_QUERY,
  LANGUAGE_STATS_QUERY,
  RECENT_SUBMISSIONS_QUERY,
  SOLVED_BEATS_QUERY,
  SOLVED_STATS_QUERY,
  SUBMISSION_CALENDAR_QUERY,
  TOPIC_STATS_QUERY,
  USER_PROFILE_QUERY,
} from "./queries";
import {
  leetCodeSchemas,
  type LeetCodeBeatsStats,
  type LeetCodeDailyChallenge,
  type LeetCodeLanguageStat,
  type LeetCodeMatchedUserProfile,
  type LeetCodeContestInfo,
  type LeetCodeSolvedStats,
  type LeetCodeSubmission,
  type LeetCodeSubmissionCalendar,
  type LeetCodeTopicStats,
  type LeetCodeUserProfileResponse,
} from "./types";

type LeetCodeDashboardResponse = {
  allQuestionsCount: Array<{ difficulty: string; count: number }>;
  matchedUser: {
    username: string;
    profile: {
      realName?: string | null;
      ranking?: number | null;
      userAvatar?: string | null;
    } | null;
    submitStatsGlobal: {
      acSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }>;
      totalSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }>;
    } | null;
    userCalendar: {
      activeYears: number[];
      streak?: number | null;
      totalActiveDays?: number | null;
      dccBadges: Array<{
        timestamp: number;
        badge: { name?: string | null; icon?: string | null } | null;
      }>;
      submissionCalendar: string;
    } | null;
    tagProblemCounts: {
      advanced: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
      intermediate: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
      fundamental: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
    } | null;
    languageProblemCount: Array<{ languageName: string; problemsSolved: number }> | null;
    problemsSolvedBeatsStats: Array<{ difficulty: string; percentage: number }> | null;
  } | null;
  userContestRanking: {
    attendedContestsCount?: number | null;
    rating?: number | null;
    globalRanking?: number | null;
    totalParticipants?: number | null;
    topPercentage?: number | null;
    badge: { name?: string | null } | null;
  } | null;
  userContestRankingHistory: Array<{
    attended?: boolean | null;
    trendDirection?: string | null;
    problemsSolved?: number | null;
    totalProblems?: number | null;
    finishTimeInSeconds?: number | null;
    rating?: number | null;
    ranking?: number | null;
    contest: {
      title?: string | null;
      titleSlug?: string | null;
      startTime?: number | null;
    } | null;
  }>;
};

async function getOrCreateCachedData<T>(
  cacheKey: string,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await getCachedValue<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await loader();
  await setCachedValue(cacheKey, data, LEETCODE_CACHE_TTL_SECONDS);
  return data;
}

function assertUserExists<T extends { matchedUser?: unknown }>(data: T, username: string) {
  if (!data.matchedUser) {
    throw new LeetCodeNotFoundError(username);
  }
}

export async function getUserProfile(username: string): Promise<LeetCodeMatchedUserProfile> {
  const cacheKey = getLeetCodeCacheKey("profile", username);

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<LeetCodeUserProfileResponse>({
      operationName: "userPublicProfile",
      query: USER_PROFILE_QUERY,
      variables: { username },
    });

    if (!data.matchedUser) {
      throw new LeetCodeNotFoundError(username);
    }

    return leetCodeSchemas.matchedUserProfileSchema.parse(data.matchedUser);
  });
}

export async function getDashboardData(username: string) {
  const cacheKey = getLeetCodeCacheKey("dashboard", username);

  return getOrCreateCachedData(cacheKey, async () => {
    const year = new Date().getFullYear();
    const data = await executeLeetCodeGraphQL<LeetCodeDashboardResponse>({
      operationName: "dashboard",
      query: DASHBOARD_QUERY,
      variables: { username, year },
    });

    if (!data.matchedUser) {
      throw new LeetCodeNotFoundError(username);
    }

    const profile = leetCodeSchemas.matchedUserProfileSchema.parse({
      username: data.matchedUser.username,
      profile: data.matchedUser.profile ?? null,
      contestBadge: null,
    });

    const stats = leetCodeSchemas.solvedStatsResponseSchema.parse({
      allQuestionsCount: data.allQuestionsCount,
      matchedUser: {
        submitStatsGlobal: data.matchedUser.submitStatsGlobal,
        submitStats: data.matchedUser.submitStatsGlobal,
      },
    });

    const contest = leetCodeSchemas.contestInfoResponseSchema.parse({
      matchedUser: null,
      userContestRanking: data.userContestRanking,
      userContestRankingHistory: data.userContestRankingHistory,
    });

    const calendar = leetCodeSchemas.submissionCalendarResponseSchema.parse({
      matchedUser: {
        userCalendar: data.matchedUser.userCalendar,
      },
    });

    const topicStats = leetCodeSchemas.topicStatsResponseSchema.parse({
      matchedUser: {
        tagProblemCounts: data.matchedUser.tagProblemCounts,
      },
    });

    const languages: LeetCodeLanguageStat[] = (data.matchedUser.languageProblemCount ?? []).map((language) => ({
      language: language.languageName,
      solved: language.problemsSolved,
    })).sort((a, b) => b.solved - a.solved);

    const beats: LeetCodeBeatsStats = {
      easy:
        data.matchedUser.problemsSolvedBeatsStats?.find((item) => item.difficulty === "Easy")?.percentage ?? 0,
      medium:
        data.matchedUser.problemsSolvedBeatsStats?.find((item) => item.difficulty === "Medium")?.percentage ?? 0,
      hard:
        data.matchedUser.problemsSolvedBeatsStats?.find((item) => item.difficulty === "Hard")?.percentage ?? 0,
    };

    return {
      profile,
      stats,
      contest,
      calendar,
      topicStats,
      languages,
      beats,
    };
  });
}

export async function getSolvedStats(username: string): Promise<LeetCodeSolvedStats> {
  const cacheKey = getLeetCodeCacheKey("solved-stats", username);

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<LeetCodeSolvedStats>({
      operationName: "userProblemsSolved",
      query: SOLVED_STATS_QUERY,
      variables: { username },
    });

    return leetCodeSchemas.solvedStatsResponseSchema.parse(data);
  });
}

export async function getContestInfo(username: string): Promise<LeetCodeContestInfo> {
  const cacheKey = getLeetCodeCacheKey("contest-info", username);

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<LeetCodeContestInfo>({
      operationName: "userContestInfo",
      query: CONTEST_INFO_QUERY,
      variables: { username },
    });

    assertUserExists(data, username);
    return leetCodeSchemas.contestInfoResponseSchema.parse(data);
  });
}

export async function getSubmissionCalendar(
  username: string,
): Promise<LeetCodeSubmissionCalendar> {
  const cacheKey = getLeetCodeCacheKey("submission-calendar", username);
  const year = new Date().getFullYear();

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<LeetCodeSubmissionCalendar>({
      operationName: "userSubmissionCalendar",
      query: SUBMISSION_CALENDAR_QUERY,
      variables: { username, year },
    });

    assertUserExists(data, username);
    return leetCodeSchemas.submissionCalendarResponseSchema.parse(data);
  });
}

export async function getTopicStats(username: string): Promise<LeetCodeTopicStats> {
  const cacheKey = getLeetCodeCacheKey("topic-stats", username);

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<LeetCodeTopicStats>({
      operationName: "skillStats",
      query: TOPIC_STATS_QUERY,
      variables: { username },
    });

    assertUserExists(data, username);
    return leetCodeSchemas.topicStatsResponseSchema.parse(data);
  });
}

export async function getRecentSubmissions(
  username: string,
  limit = 20,
): Promise<LeetCodeSubmission[]> {
  const cacheKey = getLeetCodeCacheKey("submissions", username, String(limit));

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<{
      recentSubmissionList: Array<{
        id: string;
        title: string;
        titleSlug: string;
        timestamp: string;
        statusDisplay: string;
        lang: string;
        runtime: string;
        memory: string;
      }>;
    }>({
      operationName: "getRecentSubmissions",
      query: RECENT_SUBMISSIONS_QUERY,
      variables: { username, limit },
    });

    return (data.recentSubmissionList ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      titleSlug: s.titleSlug,
      timestamp: parseInt(s.timestamp, 10),
      status: s.statusDisplay,
      language: s.lang,
      runtime: s.runtime,
      memory: s.memory,
    }));
  });
}

export async function getLanguageStats(username: string): Promise<LeetCodeLanguageStat[]> {
  const cacheKey = getLeetCodeCacheKey("languages", username);

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<{
      matchedUser: {
        languageProblemCount: Array<{ languageName: string; problemsSolved: number }>;
      } | null;
    }>({
      operationName: "languageStats",
      query: LANGUAGE_STATS_QUERY,
      variables: { username },
    });

    assertUserExists(data, username);
    return (data.matchedUser?.languageProblemCount ?? [])
      .map((l) => ({ language: l.languageName, solved: l.problemsSolved }))
      .sort((a, b) => b.solved - a.solved);
  });
}

export async function getSolvedBeats(username: string): Promise<LeetCodeBeatsStats> {
  const cacheKey = getLeetCodeCacheKey("beats", username);

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<{
      matchedUser: {
        problemsSolvedBeatsStats: Array<{ difficulty: string; percentage: number }>;
      } | null;
    }>({
      operationName: "beats",
      query: SOLVED_BEATS_QUERY,
      variables: { username },
    });

    assertUserExists(data, username);
    const stats = data.matchedUser?.problemsSolvedBeatsStats ?? [];
    return {
      easy: stats.find((s) => s.difficulty === "Easy")?.percentage ?? 0,
      medium: stats.find((s) => s.difficulty === "Medium")?.percentage ?? 0,
      hard: stats.find((s) => s.difficulty === "Hard")?.percentage ?? 0,
    };
  });
}

export async function getDailyChallenge(): Promise<LeetCodeDailyChallenge | null> {
  const cacheKey = getLeetCodeCacheKey("daily", "global");

  return getOrCreateCachedData(cacheKey, async () => {
    const data = await executeLeetCodeGraphQL<{
      activeDailyCodingChallengeQuestion: {
        date: string;
        link: string;
        question: {
          title: string;
          difficulty: string;
          titleSlug: string;
          topicTags: Array<{ name: string }>;
        };
      } | null;
    }>({
      operationName: "dailyChallenge",
      query: DAILY_CHALLENGE_QUERY,
      variables: {},
    });

    const daily = data.activeDailyCodingChallengeQuestion;
    if (!daily) return null;

    return {
      date: daily.date,
      link: daily.link,
      title: daily.question.title,
      difficulty: daily.question.difficulty,
      titleSlug: daily.question.titleSlug,
      topics: daily.question.topicTags.map((t) => t.name),
    };
  });
}

export async function getFriendsProfiles(usernames: string[]) {
  return Promise.all(
    usernames.map(async (username) => {
      try {
        const { profile, stats, contest, calendar } = await getDashboardData(username);
        return { username, profile, stats, contest, calendar, error: null };
      } catch (error) {
        return {
          username,
          profile: null,
          stats: null,
          contest: null,
          calendar: null,
          error: error instanceof Error ? error.message : "Failed to fetch",
        };
      }
    }),
  );
}
