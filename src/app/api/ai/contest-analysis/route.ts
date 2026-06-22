import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User, type IUser } from "@/models/user";
import { buildAIContext } from "@/lib/aiContext";
import { getCached, setCached, invalidateCache } from "@/lib/redis";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function stripJsonFences(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

type ContestHistoryEntry = {
  attended?: boolean;
};

type ContestAnalysisResponse = {
  trend: string;
  trendReason: string;
  avgProblemsSolved: number;
  tips: string[];
  nextContestGoal: string;
  ratingPrediction: string;
};

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

    const currentUser = user as unknown as IUser;
    const userId = currentUser._id.toString();
    const cacheKey = `ai:contest:${userId}`;
    const body = await request.json();
    const contestHistory = Array.isArray(body.contestHistory) ? body.contestHistory : [];
    const refresh = body.refresh === true;

    if (refresh) {
      await invalidateCache(cacheKey);
    }

    const cached = await getCached<ContestAnalysisResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const attended = (contestHistory as ContestHistoryEntry[]).filter((c) => c.attended);
    const recent = attended.slice(-10);
    const context = await buildAIContext(userId);
    const prompt = `\n${context}\n\nContest history (attended only):\n${JSON.stringify(recent)}\n\nReturn ONLY this JSON:\n{\n  "trend": "improving | declining | volatile | stable",\n  "trendReason": "One sentence with specific numbers",\n  "avgProblemsSolved": <number>,\n  "tips": [\n    "Specific tip 1 based on their actual data",\n    "Specific tip 2",\n    "Specific tip 3"\n  ],\n  "nextContestGoal": "Specific target for next contest",\n  "ratingPrediction": "At this pace, you'll reach X rating in Y contests"\n}`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "";
    const json = stripJsonFences(content);
    const parsed = JSON.parse(json);

    await setCached(cacheKey, parsed, 3600);
    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate contest analysis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
