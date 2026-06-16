import { z } from "zod";
import type { DailyDigest } from "@/lib/ai/types";
import type { Goal } from "@/models";

const telegramSendMessageResultSchema = z.object({
  message_id: z.number().int(),
  date: z.number().int(),
  chat: z.object({
    id: z.union([z.number(), z.string()]),
    type: z.string(),
  }),
  text: z.string().optional(),
});

const telegramApiResponseSchema = z.object({
  ok: z.boolean(),
  result: telegramSendMessageResultSchema.optional(),
  description: z.string().optional(),
});

export const telegramSchemas = {
  telegramSendMessageResultSchema,
  telegramApiResponseSchema,
} as const;

export type TelegramSendMessageResult = z.infer<typeof telegramSendMessageResultSchema>;
export type TelegramApiResponse = z.infer<typeof telegramApiResponseSchema>;

export type TelegramMessageInput = {
  text: string;
  chatId?: string;
  disableWebPagePreview?: boolean;
};

export type DailyDigestNotificationInput = {
  username: string;
  digest: DailyDigest;
  chatId?: string;
};

export type StreakReminderInput = {
  username: string;
  streakDays: number;
  missedDays?: number;
  targetTopic?: string;
  chatId?: string;
};

export type GoalUpdateKind = "created" | "updated" | "completed" | "deleted";

export type GoalUpdateNotificationInput = {
  username: string;
  goal: Goal;
  progress: number;
  kind: GoalUpdateKind;
  chatId?: string;
};
