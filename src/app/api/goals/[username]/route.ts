import { z } from "zod";
import { getUser } from "@/lib/repositories";
import {
  createGoal,
  getGoalProgress,
  getGoals,
} from "@/lib/repositories";
import { handleApiError, jsonError, jsonSuccess, usernameParamSchema } from "@/lib/api/route-utils";
import { goalStatuses } from "@/models";

export const dynamic = "force-dynamic";

const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  targetCount: z.number().int().positive(),
  currentCount: z.number().int().min(0).default(0),
  targetDate: z.string().datetime(),
  status: z.enum(goalStatuses).optional(),
});

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { username } = usernameParamSchema.parse(await params);
    const user = await getUser({ leetcodeUsername: username });

    if (!user) {
      return jsonSuccess({ username, goals: [] });
    }

    const goals = await getGoals(user._id);

    return jsonSuccess({
      username,
      goals: goals.map((goal) => ({
        ...goal.toObject(),
        progressPercentage: getGoalProgress(goal),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { username } = usernameParamSchema.parse(await params);
    const user = await getUser({ leetcodeUsername: username });
    if (!user) {
      return jsonError("User not found", 404);
    }

    const body = createGoalSchema.parse(await request.json());
    const goal = await createGoal({
      userId: user._id,
      title: body.title,
      description: body.description,
      targetCount: body.targetCount,
      currentCount: body.currentCount,
      targetDate: new Date(body.targetDate),
      status: body.status,
    });

    return jsonSuccess({
      goal: {
        ...goal.toObject(),
        progressPercentage: getGoalProgress(goal),
      },
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
