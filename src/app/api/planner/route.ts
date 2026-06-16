import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { StudyPlan } from "@/models/StudyPlan";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function stripJsonFences(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
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

    const prompt = `Generate a complete study plan. Return ONLY valid JSON, no markdown.
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
        "sunday": { "topic": "revision", "problems": 0, "type": "rest" }
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

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "{}";
    const plan = JSON.parse(stripJsonFences(content));

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
