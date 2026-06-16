import type { ProfileInsight } from "@/lib/ai";
import type { LeetCodeContestInfo, LeetCodeMatchedUserProfile, LeetCodeSolvedStats, LeetCodeSubmissionCalendar, LeetCodeTopicStats } from "@/lib/leetcode";

type FallbackInsightInput = {
  profile: LeetCodeMatchedUserProfile;
  solvedStats: LeetCodeSolvedStats;
  contestInfo: LeetCodeContestInfo;
  submissionCalendar: LeetCodeSubmissionCalendar;
  topicStats: LeetCodeTopicStats;
};

function getSolvedCount(stats: LeetCodeSolvedStats) {
  return (
    stats.matchedUser?.submitStatsGlobal?.acSubmissionNum.find((entry) => entry.difficulty === "All")?.count ??
    stats.matchedUser?.submitStats?.acSubmissionNum.find((entry) => entry.difficulty === "All")?.count ??
    0
  );
}

function getTopTopics(topicStats: LeetCodeTopicStats) {
  return [
    ...(topicStats.matchedUser?.tagProblemCounts.advanced ?? []),
    ...(topicStats.matchedUser?.tagProblemCounts.intermediate ?? []),
    ...(topicStats.matchedUser?.tagProblemCounts.fundamental ?? []),
  ]
    .sort((left, right) => right.problemsSolved - left.problemsSolved)
    .slice(0, 6)
    .map((entry) => entry.tagName);
}

export function buildFallbackInsight({
  profile,
  solvedStats,
  contestInfo,
  submissionCalendar,
  topicStats,
}: FallbackInsightInput): ProfileInsight {
  const solvedCount = getSolvedCount(solvedStats);
  const streak = submissionCalendar.matchedUser?.userCalendar?.streak ?? 0;
  const ranking = profile.profile?.ranking ?? contestInfo.userContestRanking?.globalRanking ?? 0;
  const rating = contestInfo.userContestRanking?.rating ?? 0;
  const focusAreas = getTopTopics(topicStats);

  return {
    summary:
      solvedCount >= 500
        ? "Strong LeetCode base with consistent contest activity."
        : "The profile is trending upward and can benefit from more structured topic focus.",
    strengths: [
      `Solved ${solvedCount} problems overall`,
      `Current streak of ${streak} days`,
      ranking ? `Profile ranking around ${ranking}` : "Public profile is available for ranking analysis",
    ],
    weaknesses: [
      rating ? `Contest rating still has room to grow from ${Math.round(rating)}` : "Contest rating signal is still sparse",
      focusAreas.length ? "Topic distribution suggests room to deepen weak tags" : "Topic history is not rich enough yet",
    ],
    focusAreas: focusAreas.length ? focusAreas : ["Dynamic Programming", "Graphs", "Sliding Window"],
    nextSteps: [
      "Do 2 timed problems per day",
      "Review mistakes after each session",
      "Prioritize the weakest topic cluster",
    ],
    confidence: Math.max(35, Math.min(95, solvedCount > 0 ? 40 + solvedCount / 25 + streak : 45)),
  };
}
