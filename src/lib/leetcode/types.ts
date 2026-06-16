import { z } from "zod";

const tagProblemCountSchema = z.object({
  tagName: z.string(),
  tagSlug: z.string(),
  problemsSolved: z.number().int().nonnegative(),
});

const matchedUserProfileSchema = z.object({
  username: z.string(),
  githubUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  profile: z
    .object({
      ranking: z.number().int().nullable().optional(),
      userAvatar: z.string().nullable().optional(),
      realName: z.string().nullable().optional(),
      aboutMe: z.string().nullable().optional(),
      school: z.string().nullable().optional(),
      websites: z.array(z.string()).nullable().optional(),
      countryName: z.string().nullable().optional(),
      company: z.string().nullable().optional(),
      jobTitle: z.string().nullable().optional(),
      skillTags: z.array(z.string()).nullable().optional(),
      postViewCount: z.number().int().nullable().optional(),
      postViewCountDiff: z.number().int().nullable().optional(),
      reputation: z.number().int().nullable().optional(),
      reputationDiff: z.number().int().nullable().optional(),
      solutionCount: z.number().int().nullable().optional(),
      solutionCountDiff: z.number().int().nullable().optional(),
      categoryDiscussCount: z.number().int().nullable().optional(),
      categoryDiscussCountDiff: z.number().int().nullable().optional(),
    })
    .nullable()
    .optional(),
  contestBadge: z
    .object({
      name: z.string().nullable().optional(),
      expired: z.boolean().nullable().optional(),
      hoverText: z.string().nullable().optional(),
      icon: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const userProfileResponseSchema = z.object({
  matchedUser: matchedUserProfileSchema.nullable(),
});

const solvedStatsResponseSchema = z.object({
  allQuestionsCount: z.array(
    z.object({
      difficulty: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  matchedUser: z
    .object({
      submitStatsGlobal: z
        .object({
          acSubmissionNum: z.array(
            z.object({
              difficulty: z.string(),
              count: z.number().int().nonnegative(),
              submissions: z.number().int().nonnegative(),
            }),
          ),
          totalSubmissionNum: z.array(
            z.object({
              difficulty: z.string(),
              count: z.number().int().nonnegative(),
              submissions: z.number().int().nonnegative(),
            }),
          ),
        })
        .optional(),
      submitStats: z
        .object({
          acSubmissionNum: z.array(
            z.object({
              difficulty: z.string(),
              count: z.number().int().nonnegative(),
              submissions: z.number().int().nonnegative(),
            }),
          ),
          totalSubmissionNum: z.array(
            z.object({
              difficulty: z.string(),
              count: z.number().int().nonnegative(),
              submissions: z.number().int().nonnegative(),
            }),
          ),
        })
        .optional(),
    })
    .nullable(),
});

const contestInfoResponseSchema = z.object({
  matchedUser: z
    .object({
      contestBadge: z
        .object({
          name: z.string().nullable().optional(),
          expired: z.boolean().nullable().optional(),
          hoverText: z.string().nullable().optional(),
          icon: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  userContestRanking: z
    .object({
      attendedContestsCount: z.number().int().nullable().optional(),
      rating: z.number().nullable().optional(),
      globalRanking: z.number().int().nullable().optional(),
      totalParticipants: z.number().int().nullable().optional(),
      topPercentage: z.number().nullable().optional(),
      badge: z
        .object({
          name: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  userContestRankingHistory: z.array(
    z.object({
      attended: z.boolean().nullable().optional(),
      trendDirection: z.string().nullable().optional(),
      problemsSolved: z.number().int().nullable().optional(),
      totalProblems: z.number().int().nullable().optional(),
      finishTimeInSeconds: z.number().int().nullable().optional(),
      rating: z.number().nullable().optional(),
      ranking: z.number().int().nullable().optional(),
      contest: z
        .object({
          title: z.string().nullable().optional(),
          titleSlug: z.string().nullable().optional(),
          startTime: z.number().int().nullable().optional(),
        })
        .nullable()
        .optional(),
    }),
  ),
});

const submissionCalendarResponseSchema = z.object({
  matchedUser: z
    .object({
      userCalendar: z
        .object({
          activeYears: z.array(z.number().int()),
          streak: z.number().int().nullable().optional(),
          totalActiveDays: z.number().int().nullable().optional(),
          dccBadges: z.array(
            z.object({
              timestamp: z.number().int(),
              badge: z
                .object({
                  name: z.string().nullable().optional(),
                  icon: z.string().nullable().optional(),
                })
                .nullable()
                .optional(),
            }),
          ),
          submissionCalendar: z.string(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});

const topicStatsResponseSchema = z.object({
  matchedUser: z
    .object({
      tagProblemCounts: z.object({
        advanced: z.array(tagProblemCountSchema),
        intermediate: z.array(tagProblemCountSchema),
        fundamental: z.array(tagProblemCountSchema),
      }),
    })
    .nullable(),
});

export const leetCodeSchemas = {
  matchedUserProfileSchema,
  userProfileResponseSchema,
  solvedStatsResponseSchema,
  contestInfoResponseSchema,
  submissionCalendarResponseSchema,
  topicStatsResponseSchema,
} as const;

export type LeetCodeMatchedUserProfile = z.infer<typeof matchedUserProfileSchema>;
export type LeetCodeUserProfileResponse = z.infer<typeof userProfileResponseSchema>;

export type LeetCodeSolvedStats = z.infer<typeof solvedStatsResponseSchema>;

export type LeetCodeContestInfo = z.infer<typeof contestInfoResponseSchema>;

export type LeetCodeSubmissionCalendar = z.infer<typeof submissionCalendarResponseSchema>;

export type LeetCodeTopicStats = z.infer<typeof topicStatsResponseSchema>;

export type LeetCodeTopLevelGraphQLResponse<T> = {
  data: T | null;
  errors?: Array<{
    message: string;
  }>;
};

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number;
  status: string;
  language: string;
  runtime: string;
  memory: string;
}

export interface LeetCodeLanguageStat {
  language: string;
  solved: number;
}

export interface LeetCodeBeatsStats {
  easy: number;
  medium: number;
  hard: number;
}

export interface LeetCodeDailyChallenge {
  date: string;
  link: string;
  title: string;
  difficulty: string;
  titleSlug: string;
  topics: string[];
}
