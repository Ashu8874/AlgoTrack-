import { z } from "zod";

const profileInsightSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  focusAreas: z.array(z.string().min(1)),
  nextSteps: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(100),
});

const roadmapStepSchema = z.object({
  week: z.number().int().positive(),
  focus: z.string().min(1),
  objectives: z.array(z.string().min(1)),
  tasks: z.array(z.string().min(1)),
  targetSolved: z.number().int().nonnegative(),
});

const roadmapSchema = z.object({
  title: z.string().min(1),
  timeframe: z.string().min(1),
  summary: z.string().min(1),
  milestones: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
  weeklyPlan: z.array(roadmapStepSchema),
  risks: z.array(z.string().min(1)),
});

const dailyDigestSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)),
  nextActions: z.array(z.string().min(1)),
  motivationalNote: z.string().min(1),
});

export const aiSchemas = {
  profileInsightSchema,
  roadmapSchema,
  dailyDigestSchema,
} as const;

export type ProfileInsight = z.infer<typeof profileInsightSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
export type DailyDigest = z.infer<typeof dailyDigestSchema>;

export type AiResponseEnvelope<T> = {
  data: T | null;
};
