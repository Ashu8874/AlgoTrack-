import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function stripJsonFences(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = `Generate a LeetCode-style mock interview problem for ${body.company} at ${body.difficulty} difficulty.
Return ONLY valid JSON:
{"title":"...","description":"...","constraints":["..."],"examples":[{"input":"...","output":"...","explanation":"..."}],"hints":["..."],"difficulty":"${body.difficulty}","topics":["..."]}`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.choices[0]?.message?.content ?? "{}";
    return NextResponse.json(JSON.parse(stripJsonFences(content)));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
