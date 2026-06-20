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

export async function GET(request: Request) {
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

    const userId = (user as any)?._id?.toString?.();
    const dateKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `ai:briefing:${userId}:${dateKey}`;
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "1";

    if (refresh) {
      await invalidateCache(cacheKey);
    }

    const cached = await getCached<{ briefing: string }>(cacheKey);
    if (cached?.briefing) {
      return NextResponse.json(cached);
    }

    const context = await buildAIContext(userId);
    const prompt = `You are a DSA coach. Based on this user profile:\n${context}\n\nWrite a 3-sentence morning briefing:\nSentence 1: Mention their streak and one positive stat\nSentence 2: Their biggest weak topic and why it matters for their goal\nSentence 3: Exactly what to do today (specific problem or topic)\n\nBe direct, specific, friendly. No generic advice.`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "";
    const briefing = stripJsonFences(content);

    if (!briefing) {
      throw new Error("AI returned an empty briefing");
    }

    await setCached(cacheKey, { briefing }, 86400);
    return NextResponse.json({ briefing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate briefing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
