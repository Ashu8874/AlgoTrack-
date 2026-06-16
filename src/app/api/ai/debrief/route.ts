import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { MockInterview } from "@/models/MockInterview";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    const prompt = `You are an interview coach. Review this mock interview performance and give constructive feedback.
Problem: ${JSON.stringify(body.problem)}
Notes: ${body.notes}
Hints used: ${body.hintsUsed}
Duration seconds: ${body.durationSeconds}
Return 3-4 sentences of specific feedback.`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const feedback = message.choices[0]?.message?.content ?? "";
    const hintsUsed = body.hintsUsed ?? 0;
    const duration = body.durationSeconds ?? 0;
    let score = 70 - hintsUsed * 10;
    if (duration < 1800) score += 10;
    if (body.difficulty === "Hard") score += 10;
    score = Math.max(0, Math.min(100, score));

    await connectDB();
    await MockInterview.create({
      userId: user._id,
      company: body.company ?? "Unknown",
      difficulty: body.difficulty ?? "Medium",
      problem: body.problem ?? {},
      score,
      hintsUsed,
      durationSeconds: duration,
      notes: body.notes ?? "",
      feedback,
      completedAt: new Date(),
    });

    return NextResponse.json({ feedback, score });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
