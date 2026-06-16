import { z } from "zod";
import { getUser } from "@/lib/repositories";
import {
  deleteGoal,
  getGoalProgress,
  updateGoal,
} from "@/lib/repositories";
import { GoalModel } from "@/models";
import { handleApiError, jsonError, jsonSuccess, usernameParamSchema } from "@/lib/api/route-utils";
import { goalStatuses } from "@/models";

export const dynamic = "force-dynamic";

const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  targetCount: z.number().int().positive().optional(),
  currentCount: z.number().int().min(0).optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(goalStatuses).optional(),
});

type RouteContext = {
  params: Promise<{ username: string; goalId: string }>;
};

async function ensureOwnership(username: string, goalId: string) {
  const user = await getUser({ leetcodeUsername: username });
  if (!user) return null;

  const goal = await GoalModel.findOne({ _id: goalId, userId: user._id }).exec();
  return { user, goal };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { username, goalId } = await params;
    usernameParamSchema.parse({ username });
    const ownership = await ensureOwnership(username, goalId);
    if (!ownership?.goal) {
      return jsonError("Goal not found", 404);
    }

    const body = updateGoalSchema.parse(await request.json());
    const goal = await updateGoal(goalId, {
      title: body.title,
      description: body.description ?? undefined,
      targetCount: body.targetCount,
      currentCount: body.currentCount,
      status: body.status,
      ...(body.targetDate ? { targetDate: new Date(body.targetDate) } : {}),
      completedAt: body.status === "completed" ? new Date() : undefined,
    });

    if (!goal) {
      return jsonError("Goal not found", 404);
    }

    return jsonSuccess({
      goal: {
        ...goal.toObject(),
        progressPercentage: getGoalProgress(goal),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { username, goalId } = await params;
    usernameParamSchema.parse({ username });
    const ownership = await ensureOwnership(username, goalId);
    if (!ownership?.goal) {
      return jsonError("Goal not found", 404);
    }

    await deleteGoal(goalId);
    return jsonSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
