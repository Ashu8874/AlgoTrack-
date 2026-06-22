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
    const problemTitle = String(body.problemTitle ?? "Unknown");
    const difficulty = String(body.difficulty ?? "Medium");
    const topics = Array.isArray(body.topics) ? body.topics : [];
    const currentUser = user as unknown as IUser;
    const userId = currentUser._id.toString();

    const context = await buildAIContext(userId);
    const prompt = `\n${context}\n\nToday's daily challenge: "${problemTitle}" (${difficulty})\nTopics: ${topics.join(", ")}\n\nGive a personalized first hint for this user. Consider their level: they are ${currentUser.name} based on their stats.\n\nRules:\n- Do NOT give away the solution\n- Do NOT write any code\n- Give approach direction only\n- 2-3 sentences maximum\n- Mention which of their existing strengths applies here`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const hint = String(message.choices[0]?.message?.content ?? "").trim();
    return NextResponse.json({ hint });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate daily hint";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
