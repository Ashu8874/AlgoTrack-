import "server-only";

import { env } from "@/lib/env";
import { getContestInfo, getSolvedStats, getSubmissionCalendar, getTopicStats, getUserProfile } from "@/lib/leetcode";
import { buildAnalyzeProfileMessages, buildGenerateDailyDigestMessages, buildGenerateRoadmapMessages, type AnalyzeProfileInput, type GenerateDailyDigestInput, type GenerateRoadmapInput } from "./prompts";
import { aiSchemas, type DailyDigest, type ProfileInsight, type Roadmap } from "./types";
import { generateGroqJson } from "./client";

const MODEL = env.GROQ_MODEL || "llama3-70b-8192";

export async function analyzeProfile(input: Omit<AnalyzeProfileInput, "profile" | "solvedStats" | "contestInfo" | "submissionCalendar" | "topicStats"> & {
  profile?: AnalyzeProfileInput["profile"];
  solvedStats?: AnalyzeProfileInput["solvedStats"];
  contestInfo?: AnalyzeProfileInput["contestInfo"];
  submissionCalendar?: AnalyzeProfileInput["submissionCalendar"];
  topicStats?: AnalyzeProfileInput["topicStats"];
}): Promise<ProfileInsight> {
  const [profile, solvedStats, contestInfo, submissionCalendar, topicStats] = await Promise.all([
    input.profile ?? getUserProfile(input.username),
    input.solvedStats ?? getSolvedStats(input.username),
    input.contestInfo ?? getContestInfo(input.username),
    input.submissionCalendar ?? getSubmissionCalendar(input.username),
    input.topicStats ?? getTopicStats(input.username),
  ]);

  return generateGroqJson<ProfileInsight>({
    model: MODEL,
    schemaName: "profileInsight",
    messages: buildAnalyzeProfileMessages({
      username: input.username,
      profile,
      solvedStats,
      contestInfo,
      submissionCalendar,
      topicStats,
    }),
    parse: (value) => aiSchemas.profileInsightSchema.parse(value),
  });
}

export async function generateRoadmap(
  input: Omit<GenerateRoadmapInput, "profileInsight" | "profile" | "solvedStats" | "topicStats"> & {
    profileInsight?: GenerateRoadmapInput["profileInsight"];
    profile?: GenerateRoadmapInput["profile"];
    solvedStats?: GenerateRoadmapInput["solvedStats"];
    topicStats?: GenerateRoadmapInput["topicStats"];
  },
): Promise<Roadmap> {
  const [profileInsight, profile, solvedStats, topicStats] = await Promise.all([
    input.profileInsight ?? analyzeProfile({ username: input.username }),
    input.profile ?? getUserProfile(input.username),
    input.solvedStats ?? getSolvedStats(input.username),
    input.topicStats ?? getTopicStats(input.username),
  ]);

  return generateGroqJson<Roadmap>({
    model: MODEL,
    schemaName: "roadmap",
    messages: buildGenerateRoadmapMessages({
      username: input.username,
      profileInsight,
      profile,
      solvedStats,
      topicStats,
    }),
    parse: (value) => aiSchemas.roadmapSchema.parse(value),
  });
}

export async function generateDailyDigest(
  input: Omit<GenerateDailyDigestInput, "profile" | "solvedStats" | "contestInfo" | "submissionCalendar" | "topicStats"> & {
    profile?: GenerateDailyDigestInput["profile"];
    solvedStats?: GenerateDailyDigestInput["solvedStats"];
    contestInfo?: GenerateDailyDigestInput["contestInfo"];
    submissionCalendar?: GenerateDailyDigestInput["submissionCalendar"];
    topicStats?: GenerateDailyDigestInput["topicStats"];
  },
): Promise<DailyDigest> {
  const [profile, solvedStats, contestInfo, submissionCalendar, topicStats] = await Promise.all([
    input.profile ?? getUserProfile(input.username),
    input.solvedStats ?? getSolvedStats(input.username),
    input.contestInfo ?? getContestInfo(input.username),
    input.submissionCalendar ?? getSubmissionCalendar(input.username),
    input.topicStats ?? getTopicStats(input.username),
  ]);

  return generateGroqJson<DailyDigest>({
    model: MODEL,
    schemaName: "dailyDigest",
    messages: buildGenerateDailyDigestMessages({
      username: input.username,
      profile,
      solvedStats,
      contestInfo,
      submissionCalendar,
      topicStats,
    }),
    parse: (value) => aiSchemas.dailyDigestSchema.parse(value),
  });
}
