import "server-only";

import { analyzeProfile, generateRoadmap } from "@/lib/ai";
import { analyzeWeaknesses } from "@/lib/analysis";
import {
  getContestInfo,
  getSolvedStats,
  getSubmissionCalendar,
  getTopicStats,
  getUserProfile,
} from "@/lib/leetcode";
import {
  buildContestRatingOverTime,
  buildDailySubmissionChart,
  buildSolvedOverTime,
} from "@/features/dashboard/utils/analytics";
import { buildFallbackInsight } from "@/features/dashboard/utils/fallback-insight";
import type { PdfReportData } from "./types";

function getSolvedTotal(stats: Awaited<ReturnType<typeof getSolvedStats>>) {
  const solved =
    stats.matchedUser?.submitStatsGlobal?.acSubmissionNum.find((entry) => entry.difficulty === "All") ??
    stats.matchedUser?.submitStats?.acSubmissionNum.find((entry) => entry.difficulty === "All");

  return solved?.count ?? 0;
}

function buildFallbackRoadmap(username: string, weaknessLabels: string[]) {
  const topics = weaknessLabels.length ? weaknessLabels : ["Dynamic Programming", "Graphs", "Trees"];

  return {
    title: `Practical Roadmap for ${username}`,
    timeframe: "4 weeks",
    summary: "A focused plan built from the current profile, weaknesses, and contest trends.",
    milestones: [
      {
        title: "Stabilize weak topics",
        description: "Spend time on the lowest-performing topic cluster and review each miss.",
      },
      {
        title: "Build contest rhythm",
        description: "Practice timed sets and make contest review a repeatable habit.",
      },
      {
        title: "Increase consistency",
        description: "Keep a daily solving streak and track progress weekly.",
      },
    ],
    weeklyPlan: [
      {
        week: 1,
        focus: "Baseline and review",
        objectives: ["Analyze the current backlog", "Review mistakes from recent sessions"],
        tasks: ["Solve 3 easy/medium problems per day", "Write short post-mortems"],
        targetSolved: 18,
      },
      {
        week: 2,
        focus: "Weak topic focus",
        objectives: ["Push the weakest topics", "Improve recall with repetition"],
        tasks: topics.slice(0, 3).map((topic) => `Solve 2 ${topic} problems`),
        targetSolved: 20,
      },
      {
        week: 3,
        focus: "Contest performance",
        objectives: ["Simulate contest pace", "Improve accuracy under time pressure"],
        tasks: ["Do one timed contest set", "Review upsolving patterns"],
        targetSolved: 22,
      },
      {
        week: 4,
        focus: "Consistency loop",
        objectives: ["Lock in a sustainable routine", "Measure improvement"],
        tasks: ["Keep the streak alive", "Compare progress with week 1"],
        targetSolved: 24,
      },
    ],
    risks: [
      "Burnout from overloading daily goals",
      "Focusing only on solved count instead of topic balance",
      "Skipping contest review after a bad session",
    ],
  };
}

export async function buildPdfReportData(username: string): Promise<PdfReportData> {
  const [profile, stats, contest, submissionCalendar, topicStats] = await Promise.all([
    getUserProfile(username),
    getSolvedStats(username),
    getContestInfo(username),
    getSubmissionCalendar(username),
    getTopicStats(username),
  ]);

  const ranking = profile.profile?.ranking ?? contest.userContestRanking?.globalRanking ?? null;
  const contestRating = contest.userContestRanking?.rating ?? null;
  const streak = submissionCalendar.matchedUser?.userCalendar?.streak ?? null;
  const solvedTotal = getSolvedTotal(stats);

  const solvedOverTime = buildSolvedOverTime({
    contestHistory: contest.userContestRankingHistory,
    contestRating,
    streak,
    submissionCalendar: submissionCalendar.matchedUser?.userCalendar ?? null,
    totalSolved: solvedTotal,
  });
  const contestRatingOverTime = buildContestRatingOverTime({
    contestHistory: contest.userContestRankingHistory,
    contestRating,
    streak,
    submissionCalendar: submissionCalendar.matchedUser?.userCalendar ?? null,
    totalSolved: solvedTotal,
  });
  const dailySubmissionChart = buildDailySubmissionChart({
    contestHistory: contest.userContestRankingHistory,
    contestRating,
    streak,
    submissionCalendar: submissionCalendar.matchedUser?.userCalendar ?? null,
    totalSolved: solvedTotal,
  });

  const weaknessAnalysis = analyzeWeaknesses(topicStats, stats);
  const aiInsight = await analyzeProfile({
    username,
    profile,
    solvedStats: stats,
    contestInfo: contest,
    submissionCalendar,
    topicStats,
  }).catch(async () => {
    return buildFallbackInsight({
      profile,
      solvedStats: stats,
      contestInfo: contest,
      submissionCalendar,
      topicStats,
    });
  });

  const roadmap = await generateRoadmap({
    username,
    profileInsight: aiInsight,
    profile,
    solvedStats: stats,
    topicStats,
  }).catch(async () => buildFallbackRoadmap(username, weaknessAnalysis.weakestTopics.map((topic) => topic.name)));

  return {
    username,
    profile,
    stats,
    contest,
    submissionCalendar,
    topicStats,
    solvedTotal,
    ranking,
    contestRating,
    streak,
    solvedOverTime,
    contestRatingOverTime,
    dailySubmissionChart,
    weaknessAnalysis,
    aiInsight,
    roadmap,
  };
}
