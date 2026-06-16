import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { StudyPlan } from "@/models/StudyPlan";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function stripJsonFences(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    const prompt = `The user missed study tasks. Reschedule remaining days.
Remaining days: ${body.remainingDays}
Missed tasks: ${JSON.stringify(body.missedTasks)}
Current plan excerpt: ${JSON.stringify(body.currentWeek)}
Return ONLY valid JSON with updated dailyTasks for the remaining days of this week.`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "{}";
    const updated = JSON.parse(stripJsonFences(content));

    await connectDB();
    const plan = await StudyPlan.findOne({ userId: user._id });
    if (plan?.plan && typeof plan.plan === "object") {
      const planObj = plan.plan as Record<string, unknown>;
      const weeklyPlans = planObj.weeklyPlans as Array<Record<string, unknown>> | undefined;
      if (weeklyPlans?.[0]) {
        weeklyPlans[0].dailyTasks = updated.dailyTasks ?? updated;
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
