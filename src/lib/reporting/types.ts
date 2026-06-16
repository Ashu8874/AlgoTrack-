import type { DailyDigest } from "@/lib/ai";
import type { ProfileInsight, Roadmap } from "@/lib/ai";
import type { WeaknessAnalysis } from "@/lib/analysis";
import type { LeetCodeContestInfo, LeetCodeMatchedUserProfile, LeetCodeSolvedStats, LeetCodeSubmissionCalendar, LeetCodeTopicStats } from "@/lib/leetcode";

export type SolvedOverTimePoint = {
  label: string;
  solved: number;
};

export type ContestRatingPoint = {
  label: string;
  rating: number;
};

export type DailySubmissionPoint = {
  label: string;
  submissions: number;
};

export type PdfReportData = {
  username: string;
  profile: LeetCodeMatchedUserProfile;
  stats: LeetCodeSolvedStats;
  contest: LeetCodeContestInfo;
  submissionCalendar: LeetCodeSubmissionCalendar;
  topicStats: LeetCodeTopicStats;
  solvedTotal: number;
  ranking: number | null;
  contestRating: number | null;
  streak: number | null;
  solvedOverTime: SolvedOverTimePoint[];
  contestRatingOverTime: ContestRatingPoint[];
  dailySubmissionChart: DailySubmissionPoint[];
  weaknessAnalysis: WeaknessAnalysis;
  aiInsight: ProfileInsight;
  roadmap: Roadmap;
  dailyDigest?: DailyDigest | null;
};
