import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { StudyPlan } from "@/models/StudyPlan";
import { env } from "@/lib/env";
import { generateGroqJson } from "@/lib/ai/client";
import { z } from "zod";

const MODEL = env.GROQ_MODEL;

const dailyTaskSchema = z.object({
  topic: z.string().min(1),
  problems: z.number().int().nonnegative(),
  type: z.string().min(1),
});

const updatedDailyTasksSchema = z.object({
  dailyTasks: z.record(dailyTaskSchema).refine(
    (tasks) => Object.keys(tasks).length > 0,
    { message: "dailyTasks must contain at least one day" },
  ),
});

function buildFallbackUpdatedTasks() {
  return {
    dailyTasks: {
      monday: { topic: "Review", problems: 1, type: "review" },
      tuesday: { topic: "Practice", problems: 2, type: "practice" },
      wednesday: { topic: "Mock Interview", problems: 1, type: "mock" },
      thursday: { topic: "Refine", problems: 1, type: "review" },
      friday: { topic: "Strengthen", problems: 2, type: "practice" },
    },
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const requestBody = await request.json();
    const prompt = `The user missed study tasks. Reschedule the remaining days in valid JSON only.
Remaining days: ${JSON.stringify(requestBody.remainingDays)}
Missed tasks: ${JSON.stringify(requestBody.missedTasks)}
Current plan excerpt: ${JSON.stringify(requestBody.currentWeek)}
Return a JSON object with "dailyTasks" keyed by weekday for the remaining days.`;

    let updated;
    try {
      updated = await generateGroqJson({
        model: MODEL,
        schemaName: "plannerReschedule",
        messages: [{ role: "user", content: prompt }],
        parse: (value) => updatedDailyTasksSchema.parse(value),
        maxTokens: 2000,
      });
    } catch (error) {
      console.error("Planner reschedule parse error:", error);
      updated = buildFallbackUpdatedTasks();
    }

    await connectDB();
    const plan = await StudyPlan.findOne({ userId: user._id });
    if (plan?.plan && typeof plan.plan === "object") {
      const planObj = plan.plan as Record<string, unknown>;
      const weeklyPlans = planObj.weeklyPlans as Array<Record<string, unknown>> | undefined;
      if (weeklyPlans?.[0]) {
        weeklyPlans[0].dailyTasks = updated.dailyTasks;
        plan.markModified("plan");
        await plan.save();
      }
    }

    return NextResponse.json({ updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
