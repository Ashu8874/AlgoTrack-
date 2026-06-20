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
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const problem = String(body.problem ?? "Unknown problem");
    const difficulty = String(body.difficulty ?? "Medium");
    const durationMinutes = Number(body.durationMinutes ?? 0);
    const solved = Boolean(body.solved);
    const hintsUsed = Number(body.hintsUsed ?? 0);
    const notes = String(body.notes ?? "None");
    const userId = (user as any)?._id?.toString?.();

    const context = await buildAIContext(userId);
    const prompt = `
${context}

The user just completed a timed LeetCode session:\nProblem: ${problem} (${difficulty})\nTime taken: ${durationMinutes} minutes\nSolved successfully: ${solved}\nHints used: ${hintsUsed}\nNotes: ${notes}\n\nReturn ONLY this JSON:\n{\n  "score": <0-100 integer>,\n  "verdict": "Excellent | Good | Needs Work",\n  "whatWentWell": "One specific positive observation",\n  "whatToImprove": "One specific improvement",\n  "nextProblem": {\n    "title": "...",\n    "slug": "...",\n    "reason": "Why this problem is the right next step"\n  },\n  "motivationalLine": "One short personalized sentence"\n}\n\nScore rubric:\nStart at 100.\n-20 if not solved\n-10 per hint used\n-10 if time > typical for difficulty (Easy > 15min, Medium > 35min, Hard > 60min)`;

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
    const message = error instanceof Error ? error.message : "Failed to generate session debrief";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
