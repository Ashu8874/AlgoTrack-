import type { ProfileInsight } from "./types";
import type { LeetCodeContestInfo, LeetCodeMatchedUserProfile, LeetCodeSolvedStats, LeetCodeSubmissionCalendar, LeetCodeTopicStats } from "@/lib/leetcode";

type AnalyzeProfileInput = {
  username: string;
  profile: LeetCodeMatchedUserProfile;
  solvedStats: LeetCodeSolvedStats;
  contestInfo: LeetCodeContestInfo;
  submissionCalendar: LeetCodeSubmissionCalendar;
  topicStats: LeetCodeTopicStats;
};

type GenerateRoadmapInput = {
  username: string;
  profileInsight: ProfileInsight;
  profile: LeetCodeMatchedUserProfile;
  solvedStats: LeetCodeSolvedStats;
  topicStats: LeetCodeTopicStats;
};

type GenerateDailyDigestInput = {
  username: string;
  profile: LeetCodeMatchedUserProfile;
  solvedStats: LeetCodeSolvedStats;
  contestInfo: LeetCodeContestInfo;
  submissionCalendar: LeetCodeSubmissionCalendar;
  topicStats: LeetCodeTopicStats;
};

function stringify(data: unknown) {
  return JSON.stringify(data, null, 2);
}

export function buildAnalyzeProfileMessages(input: AnalyzeProfileInput) {
  return [
    {
      role: "system" as const,
      content:
        "You are a senior LeetCode coach. Return only valid JSON that matches the requested schema. Do not wrap the answer in markdown.",
    },
    {
      role: "user" as const,
      content: `
Analyze this LeetCode profile and return JSON with:
- summary
- strengths
- weaknesses
- focusAreas
- nextSteps
- confidence (0-100)

User: ${input.username}

Profile:
${stringify(input.profile)}

Solved Stats:
${stringify(input.solvedStats)}

Contest Info:
${stringify(input.contestInfo)}

Submission Calendar:
${stringify(input.submissionCalendar)}

Topic Stats:
${stringify(input.topicStats)}
`,
    },
  ];
}

export function buildGenerateRoadmapMessages(input: GenerateRoadmapInput) {
  return [
    {
      role: "system" as const,
      content:
        "You are a LeetCode roadmap planner. Return only valid JSON that matches the requested schema. Do not wrap the answer in markdown.",
    },
    {
      role: "user" as const,
      content: `
Generate a practical roadmap JSON with:
- title
- timeframe
- summary
- milestones
- weeklyPlan
- risks

User: ${input.username}

Profile Insight:
${stringify(input.profileInsight)}

Profile:
${stringify(input.profile)}

Solved Stats:
${stringify(input.solvedStats)}

Topic Stats:
${stringify(input.topicStats)}
`,
    },
  ];
}

export function buildGenerateDailyDigestMessages(input: GenerateDailyDigestInput) {
  return [
    {
      role: "system" as const,
      content:
        "You are a LeetCode daily digest assistant. Return only valid JSON that matches the requested schema. Do not wrap the answer in markdown.",
    },
    {
      role: "user" as const,
      content: `
Create a concise daily digest JSON with:
- title
- summary
- highlights
- risks
- nextActions
- motivationalNote

User: ${input.username}

Profile:
${stringify(input.profile)}

Solved Stats:
${stringify(input.solvedStats)}

Contest Info:
${stringify(input.contestInfo)}

Submission Calendar:
${stringify(input.submissionCalendar)}

Topic Stats:
${stringify(input.topicStats)}
`,
    },
  ];
}

export type { AnalyzeProfileInput, GenerateDailyDigestInput, GenerateRoadmapInput };
