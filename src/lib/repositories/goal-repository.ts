import { Types } from "mongoose";
import { connectMongoose } from "../mongoose";
import { GoalModel, type Goal, type GoalStatus } from "@/models";

export type CreateGoalInput = Omit<Goal, "userId" | "status" | "currentCount" | "completedAt"> & {
  userId: string | Types.ObjectId;
  status?: GoalStatus;
  currentCount?: number;
  completedAt?: Date | null;
};

export type UpdateGoalInput = Partial<
  Pick<Goal, "title" | "description" | "status" | "targetCount" | "currentCount" | "targetDate" | "completedAt">
>;

function normalizeGoal(input: CreateGoalInput) {
  const currentCount = input.currentCount ?? 0;
  const targetCount = input.targetCount;
  const completedAt =
    input.completedAt ?? (currentCount >= targetCount ? new Date() : undefined);
  const status =
    input.status ?? (currentCount >= targetCount ? "completed" : "active");

  return {
    ...input,
    status,
    currentCount,
    completedAt,
  };
}

export async function createGoal(input: CreateGoalInput) {
  await connectMongoose();
  return GoalModel.create(normalizeGoal(input));
}

export async function updateGoal(goalId: string | Types.ObjectId, updates: UpdateGoalInput) {
  await connectMongoose();

  const existingGoal = await GoalModel.findById(goalId).exec();
  if (!existingGoal) return null;

  const nextTargetCount = updates.targetCount ?? existingGoal.targetCount;
  const nextCurrentCount = updates.currentCount ?? existingGoal.currentCount;
  const shouldComplete =
    updates.status === "completed" ||
    nextCurrentCount >= nextTargetCount ||
    existingGoal.status === "completed";

  const nextStatus: GoalStatus =
    updates.status ?? (shouldComplete ? "completed" : existingGoal.status);

  const shouldUnsetCompletedAt =
    nextStatus !== "completed" &&
    (updates.completedAt === null ||
      updates.status === "active" ||
      updates.status === "paused" ||
      updates.status === "archived");
  const nextCompletedAt =
    nextStatus === "completed"
      ? updates.completedAt ?? existingGoal.completedAt ?? new Date()
      : updates.completedAt ?? undefined;

  const updateDocument: Record<string, unknown> = {
    $set: {
      ...updates,
      targetCount: nextTargetCount,
      currentCount: nextCurrentCount,
      status: nextStatus,
      ...(nextCompletedAt ? { completedAt: nextCompletedAt } : {}),
    },
  };

  if (shouldUnsetCompletedAt || (!nextCompletedAt && nextStatus !== "completed")) {
    updateDocument.$unset = { completedAt: 1 };
  }

  return GoalModel.findByIdAndUpdate(goalId, updateDocument, {
    new: true,
    runValidators: true,
  }).exec();
}

export async function deleteGoal(goalId: string | Types.ObjectId) {
  await connectMongoose();
  return GoalModel.findByIdAndDelete(goalId).exec();
}

export async function getGoals(userId: string | Types.ObjectId) {
  await connectMongoose();
  return GoalModel.find({ userId }).sort({ targetDate: 1, createdAt: -1 }).exec();
}

export function getGoalProgress(goal: Pick<Goal, "currentCount" | "targetCount">) {
  if (!goal.targetCount || goal.targetCount <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100)));
}
