import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type === "approach" ? "approach" : "nudge";
    const prompt =
      type === "approach"
        ? `Give a high-level approach hint for this problem without revealing the full solution: ${body.problem}. 2-3 sentences.`
        : `Give a small nudge hint for this problem without spoiling it: ${body.problem}. 1 sentence.`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ hint: message.choices[0]?.message?.content ?? "" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
