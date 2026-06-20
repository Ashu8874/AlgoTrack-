import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import { buildAIContext } from "@/lib/aiContext";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function stripJsonFences(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = (await User.findOne({ email: session.user.email }).lean()) as any;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const company = String(body.company ?? "Unknown");
    const difficulty = String(body.difficulty ?? "Medium");
    const notes = String(body.notes ?? "None");
    const score = Number(body.score ?? 0);
    const hintsUsed = Number(body.hintsUsed ?? 0);
    const duration = Number(body.duration ?? 0);
    const userId = (user as any)?._id?.toString?.();

    const context = await buildAIContext(userId);
    const prompt = `\n${context}\n\nThe user just completed a mock ${company} interview.\nDifficulty: ${difficulty}\nFinal score: ${score}/100\nHints used: ${hintsUsed}\nDuration: ${duration} minutes\nUser's notes/approach: ${notes}\n\nReturn ONLY this JSON:\n{\n  "interviewerVerdict": "Would hire | Maybe | Would not hire",\n  "verdictReason": "One sentence as if you are a ${company} interviewer",\n  "strengths": ["...", "..."],\n  "redFlags": ["...", "..."],\n  "mustStudyBefore": ["topic1", "topic2", "topic3"],\n  "improvedScoreRequires": "What specifically needs to change to score 90+",\n  "encouragement": "One honest but kind closing sentence"\n}`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "";
    const json = stripJsonFences(content);
    const parsed = JSON.parse(json);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate interview feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
