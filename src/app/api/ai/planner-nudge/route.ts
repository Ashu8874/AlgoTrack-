import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User, type IUser } from "@/models/user";
import { buildAIContext } from "@/lib/aiContext";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const weekPlan = body.weekPlan ?? { target: 0 };
    const completedCount = Number(body.completedCount ?? 0);
    const remainingDays = Number(body.remainingDays ?? 0);
    const target = Number(weekPlan.target ?? 0);

    if (completedCount >= target) {
      return NextResponse.json({ onTrack: true, nudge: "✅ You're on track! Keep it up.", problemsPerDay: 0 });
    }

    const currentUser = user as unknown as IUser;
    const context = await buildAIContext(currentUser._id.toString());
    const prompt = `\n${context}\n\nStudy plan status:\n- Planned problems this week: ${target}\n- Completed so far: ${completedCount}\n- Days remaining in week: ${remainingDays}\n- Behind by: ${target - completedCount} problems\n\nGive a realistic catch-up plan in 2-3 sentences. Tell them exactly how many problems per day for remaining days. Be encouraging but honest. Don't sugarcoat if they're very behind.`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 250,
      messages: [{ role: "user", content: prompt }],
    });

    const nudge = String(message.choices[0]?.message?.content ?? "").trim();
    const problemsPerDay = remainingDays > 0 ? Math.ceil((target - completedCount) / remainingDays) : target - completedCount;
    return NextResponse.json({ onTrack: false, nudge, problemsPerDay });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate planner nudge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
