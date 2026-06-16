import "server-only";

import { buildDailyDigestMessage, buildGoalUpdateMessage, buildStreakReminderMessage } from "./messages";
import { sendTelegramMessage } from "./client";
import type {
  DailyDigestNotificationInput,
  GoalUpdateNotificationInput,
  StreakReminderInput,
  TelegramSendMessageResult,
} from "./types";

export async function sendDailyDigestNotification(
  input: DailyDigestNotificationInput,
): Promise<TelegramSendMessageResult> {
  return sendTelegramMessage(buildDailyDigestMessage(input));
}

export async function sendStreakReminderNotification(
  input: StreakReminderInput,
): Promise<TelegramSendMessageResult> {
  return sendTelegramMessage(buildStreakReminderMessage(input));
}

export async function sendGoalUpdateNotification(
  input: GoalUpdateNotificationInput,
): Promise<TelegramSendMessageResult> {
  return sendTelegramMessage(buildGoalUpdateMessage(input));
}
