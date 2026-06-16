import type {
  DailyDigestNotificationInput,
  GoalUpdateNotificationInput,
  StreakReminderInput,
  TelegramMessageInput,
} from "./types";

function formatList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

export function buildDailyDigestMessage(input: DailyDigestNotificationInput): TelegramMessageInput {
  const { digest, username } = input;

  return {
    chatId: input.chatId,
    text: [
      `Daily digest for ${username}`,
      "",
      digest.title,
      digest.summary,
      "",
      "Highlights:",
      formatList(digest.highlights),
      "",
      "Risks:",
      formatList(digest.risks),
      "",
      "Next actions:",
      formatList(digest.nextActions),
      "",
      `Motivation: ${digest.motivationalNote}`,
    ].join("\n"),
    disableWebPagePreview: true,
  };
}

export function buildStreakReminderMessage(
  input: StreakReminderInput,
): TelegramMessageInput {
  const parts = [
    `Streak reminder for ${input.username}`,
    "",
    `Current streak: ${input.streakDays} day${input.streakDays === 1 ? "" : "s"}`,
  ];

  if (typeof input.missedDays === "number") {
    parts.push(`Missed days: ${input.missedDays}`);
  }

  if (input.targetTopic) {
    parts.push(`Focus topic: ${input.targetTopic}`);
  }

  parts.push("", "A small session today keeps the momentum going.");

  return {
    chatId: input.chatId,
    text: parts.join("\n"),
    disableWebPagePreview: true,
  };
}

export function buildGoalUpdateMessage(
  input: GoalUpdateNotificationInput,
): TelegramMessageInput {
  const { goal, kind, progress, username } = input;
  const statusLabel = kind.charAt(0).toUpperCase() + kind.slice(1);

  return {
    chatId: input.chatId,
    text: [
      `Goal ${statusLabel} for ${username}`,
      "",
      `Title: ${goal.title}`,
      `Status: ${goal.status}`,
      `Progress: ${progress}%`,
      `Target: ${goal.currentCount}/${goal.targetCount}`,
      goal.description ? `Description: ${goal.description}` : undefined,
      goal.targetDate ? `Target date: ${goal.targetDate.toISOString()}` : undefined,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
    disableWebPagePreview: true,
  };
}
