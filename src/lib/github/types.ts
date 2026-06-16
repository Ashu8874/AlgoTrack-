import { z } from "zod";

const contributionDaySchema = z.object({
  date: z.string(),
  contributionCount: z.number().int().nonnegative(),
  contributionLevel: z.string(),
});

const contributionWeekSchema = z.object({
  firstDay: z.string(),
  contributionDays: z.array(contributionDaySchema),
});

const contributionCalendarSchema = z.object({
  totalContributions: z.number().int().nonnegative(),
  weeks: z.array(contributionWeekSchema),
});

const contributionsCollectionSchema = z.object({
  totalContributions: z.number().int().nonnegative(),
  totalCommitContributions: z.number().int().nonnegative(),
  contributionCalendar: contributionCalendarSchema,
});

const gitHubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable().optional(),
  contributionsCollection: contributionsCollectionSchema,
});

const userResponseSchema = z.object({
  user: gitHubUserSchema.nullable(),
});

export const gitHubSchemas = {
  contributionDaySchema,
  contributionWeekSchema,
  contributionCalendarSchema,
  contributionsCollectionSchema,
  gitHubUserSchema,
  userResponseSchema,
} as const;

export type GitHubContributionDay = z.infer<typeof contributionDaySchema>;
export type GitHubContributionWeek = z.infer<typeof contributionWeekSchema>;
export type GitHubContributionCalendar = z.infer<typeof contributionCalendarSchema>;
export type GitHubContributionsCollection = z.infer<typeof contributionsCollectionSchema>;
export type GitHubUser = z.infer<typeof gitHubUserSchema>;
export type GitHubUserResponse = z.infer<typeof userResponseSchema>;

export type GitHubTopLevelGraphQLResponse<T> = {
  data: T | null;
  errors?: Array<{
    message: string;
  }>;
};

export type GitHubContributionSummary = {
  username: string;
  displayName: string | null;
  from: string;
  to: string;
  totalContributions: number;
  totalCommitContributions: number;
  activeDays: number;
  activeWeeks: number;
  currentStreakDays: number;
  contributionCalendar: GitHubContributionCalendar;
};

export type GitHubCommitSummary = {
  username: string;
  totalCommits: number;
  averageCommitsPerActiveWeek: number;
  averageCommitsPerDay: number;
  activeDays: number;
  activeWeeks: number;
  recentWeeklyCommits: Array<{
    weekStart: string;
    commits: number;
  }>;
};

export type GitHubConsistencyScore = {
  username: string;
  score: number;
  label: "Excellent" | "Strong" | "Moderate" | "Needs consistency";
  breakdown: {
    activity: number;
    volume: number;
    streak: number;
  };
  activeDays: number;
  activeWeeks: number;
  currentStreakDays: number;
};
