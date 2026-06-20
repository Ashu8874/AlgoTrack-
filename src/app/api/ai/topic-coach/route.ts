import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import { buildAIContext } from "@/lib/aiContext";
import { getCached, setCached, invalidateCache } from "@/lib/redis";

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
    const topicName = String(body.topicName ?? "");
    const solved = Number(body.solved ?? 0);
    const acceptanceRate = Number(body.acceptanceRate ?? 0);
    const refresh = body.refresh === true;
    const userId = (user as any)?._id?.toString?.();
    const cacheKey = `ai:topic:${userId}:${topicName}`;

    if (!topicName) {
      return NextResponse.json({ error: "Missing topicName" }, { status: 400 });
    }

    if (refresh) {
      await invalidateCache(cacheKey);
    }

    const cached = await getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const context = await buildAIContext(userId);
    const prompt = `
${context}

The user is studying: ${topicName}\nProblems solved in this topic: ${solved}\nTheir acceptance rate: ${acceptanceRate}%\n\nReturn ONLY this JSON:\n{\n  "level": "Beginner | Intermediate | Advanced",\n  "levelReason": "One sentence why",\n  "keyPattern": "The most important pattern to master",\n  "patternTip": "One sentence on how to identify this pattern",\n  "nextProblems": [\n    { "title": "...", "slug": "...", "why": "..." },\n    { "title": "...", "slug": "...", "why": "..." },\n    { "title": "...", "slug": "...", "why": "..." }\n  ]\n}`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "";
    const json = stripJsonFences(content);
    const parsed = JSON.parse(json);

    await setCached(cacheKey, parsed, 1800);
    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate topic coach";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
