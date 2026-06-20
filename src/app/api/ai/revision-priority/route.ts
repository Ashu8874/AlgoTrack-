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
    const dueProblems = Array.isArray(body.dueProblems) ? body.dueProblems : [];
    const targetCompany = String((body.targetCompany as string) ?? (user as any)?.targetCompany ?? "Not set");
    const daysUntilInterview = body.daysUntilInterview ?? "unknown";
    const userId = (user as any)?._id?.toString?.();

    const context = await buildAIContext(userId);
    const prompt = `\n${context}\n\nThese problems are due for revision today:\n${JSON.stringify(dueProblems)}\n\nRe-rank them by priority for a ${targetCompany} interview in ${daysUntilInterview} days.\n\nReturn ONLY this JSON:\n{\n  "rankedProblems": [\n    {\n      "slug": "...",\n      "title": "...",\n      "priority": 1,\n      "reason": "DP is your weakest area and ${targetCompany} asks it frequently"\n    }\n  ]\n}`;

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
    const message = error instanceof Error ? error.message : "Failed to generate revision priority";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
