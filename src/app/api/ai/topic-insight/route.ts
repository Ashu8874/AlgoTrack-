import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = `You're analyzing LeetCode topic performance for "${body.topic}".
Skill data: ${JSON.stringify(body.skillData)}
Give 3 specific tips to improve in this topic. Be concise and actionable.`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ insight: message.choices[0]?.message?.content ?? "" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
