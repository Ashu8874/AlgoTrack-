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

    const userId = user._id.toString();
    const cacheKey = `ai:weakness:${userId}`;
    const body = await request.json().catch(() => ({}));
    const refresh = body.refresh === true;

    if (refresh) {
      await invalidateCache(cacheKey);
    }

    const cached = await getCached<{ gaps: Array<{ topic: string; severity: string; reason: string; fix: string }> }>(cacheKey);
    if (cached?.gaps) {
      return NextResponse.json(cached);
    }

    const context = await buildAIContext(userId);
    const prompt = `
${context}

Identify 3 DSA topic gaps that will hurt this user most in their target company interview.\n\nReturn ONLY this JSON, nothing else:\n{\n  "gaps": [\n    {\n      "topic": "Dynamic Programming",\n      "severity": "critical",\n      "reason": "Only X problems solved. Target company asks DP in 60% of rounds.",\n      "fix": "Solve Climbing Stairs → House Robber → Coin Change this week"\n    }\n  ]\n}`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "";
    const json = stripJsonFences(content);
    const parsed = JSON.parse(json) as { gaps: Array<{ topic: string; severity: string; reason: string; fix: string }> };

    if (!Array.isArray(parsed.gaps)) {
      throw new Error("AI returned invalid weakness data");
    }

    await setCached(cacheKey, parsed, 3600);
    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate weakness alert";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
