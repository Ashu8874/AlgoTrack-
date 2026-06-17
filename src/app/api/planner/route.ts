import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { StudyPlan } from "@/models/StudyPlan";
import { env } from "@/lib/env";
import { generateGroqJson } from "@/lib/ai/client";
import { z } from "zod";

const MODEL = env.GROQ_MODEL;

const studyPlanSchema = z.object({
  planTitle: z.string().min(1),
  totalWeeks: z.number().int().min(1),
  weeksUntilInterview: z.number().int().nonnegative(),
  dailyHours: z.number().int().nonnegative(),
  weeklyPlans: z.array(
    z.object({
      week: z.number().int().positive(),
      theme: z.string().min(1),
      goals: z.array(z.string().min(1)),
      dailyTasks: z.record(
        z.object({
          topic: z.string().min(1),
          problems: z.number().int().nonnegative(),
          type: z.string().min(1),
        }),
      ),
      weeklyMilestone: z.string().min(1),
      problemsTarget: z.number().int().nonnegative(),
    }),
  ).min(1),
  keyTechniques: z.array(z.string().min(1)).min(1),
  warningAreas: z.array(z.string().min(1)).min(1),
}).passthrough();

function buildFallbackPlan(body: Record<string, unknown>) {
  const targetCompany = String(body.targetCompany || "Your target company");
  const interviewDate = String(body.interviewDate || new Date().toISOString());
  const dailyHours = Number(body.dailyHours ?? 2);
  const weakTopics = Array.isArray(body.weakTopics)
    ? (body.weakTopics as string[]).filter(Boolean)
    : String(body.weakTopics || "Arrays, Dynamic Programming").split(/,\s*/).filter(Boolean);
  const goal = String(body.goal || "Improve coding interview readiness");

  const weeksUntilInterview = Math.max(
    1,
    Math.ceil((new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)),
  );
  const totalWeeks = Math.max(1, Math.min(8, weeksUntilInterview));
  const themes = [
    "Foundations & Warm-up",
    "Core Data Structures",
    "Graph & Tree Mastery",
    "Dynamic Programming",
    "Mock Interview Practice",
    "Refinement & Retrospective",
  ];

  return {
    planTitle: `${targetCompany} interview prep plan`,
    totalWeeks,
    weeksUntilInterview,
    dailyHours,
    weeklyPlans: Array.from({ length: totalWeeks }, (_, index) => ({
      week: index + 1,
      theme: themes[index] ?? `Week ${index + 1} focus`,
      goals: [
        `Build consistency with ${dailyHours} hours daily`,
        `Practice ${weakTopics.slice(0, 3).join(", ")}`,
      ],
      dailyTasks: {
        monday: { topic: weakTopics[0] || "Arrays", problems: 3, type: "learn" },
        tuesday: { topic: weakTopics[1] || "Strings", problems: 3, type: "practice" },
        wednesday: { topic: weakTopics[2] || "Graphs", problems: 2, type: "review" },
        thursday: { topic: weakTopics[0] || "Arrays", problems: 4, type: "challenge" },
        friday: { topic: weakTopics[1] || "Hash Maps", problems: 3, type: "mixed" },
        saturday: { topic: weakTopics[2] || "Dynamic Programming", problems: 4, type: "mock" },
        sunday: { topic: "Revision", problems: 0, type: "rest" },
      },
      weeklyMilestone: `Master ${weakTopics.slice(0, 3).join(", ")} skills and build interview confidence`,
      problemsTarget: 18,
    })),
    keyTechniques: weakTopics.slice(0, 4),
    warningAreas: weakTopics.slice(0, 4),
  };
}

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const plan = await StudyPlan.findOne({ userId: user._id });
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    await connectDB();

    const prompt = `Generate a complete study plan using only valid JSON that matches the requested schema exactly. Do not include markdown, backticks, or extra text.
{
  "planTitle": "...",
  "totalWeeks": <n>,
  "weeksUntilInterview": <n>,
  "dailyHours": <n>,
  "weeklyPlans": [
    {
      "week": 1,
      "theme": "Arrays & HashMaps Mastery",
      "goals": ["...", "..."],
      "dailyTasks": {
        "monday": { "topic": "...", "problems": 3, "type": "learn" },
        "tuesday": { "topic": "...", "problems": 3, "type": "practice" },
        "wednesday": { "topic": "...", "problems": 2, "type": "review" },
        "thursday": { "topic": "...", "problems": 4, "type": "challenge" },
        "friday": { "topic": "...", "problems": 3, "type": "mixed" },
        "saturday": { "topic": "...", "problems": 5, "type": "mock" },
        "sunday": { "topic": "Revision", "problems": 0, "type": "rest" }
      },
      "weeklyMilestone": "...",
      "problemsTarget": 20
    }
  ],
  "keyTechniques": ["...", "..."],
  "warningAreas": ["...", "..."]
}
Target company: ${body.targetCompany}
Interview date: ${body.interviewDate}
Daily hours: ${body.dailyHours}
Weak topics: ${(body.weakTopics ?? []).join(", ")}
Goal: ${body.goal}`;

    let plan;
    try {
      plan = await generateGroqJson({
        model: MODEL,
        schemaName: "studyPlan",
        messages: [{ role: "user", content: prompt }],
        parse: (value) => studyPlanSchema.parse(value),
        maxTokens: 4000,
      });
    } catch (error) {
      console.error("Planner AI parse error:", error);
      plan = buildFallbackPlan(body);
    }

    const studyPlan = await StudyPlan.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        targetCompany: body.targetCompany,
        interviewDate: new Date(body.interviewDate),
        dailyHours: body.dailyHours,
        weakTopics: body.weakTopics ?? [],
        goal: body.goal,
        plan,
        completedDays: [],
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ plan: studyPlan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
