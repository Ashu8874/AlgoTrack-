import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSolvedStats } from "@/lib/leetcode";

const defaultInsights = [
  "Keep grinding! Your consistent effort on LeetCode is building strong problem-solving skills. Focus on quality over quantity.",
  "Great progress! Consider tackling some medium-level problems to strengthen your core concepts.",
  "You're doing amazing! Remember, consistency beats intensity. Keep up the daily practice.",
  "Focus on problem patterns rather than just solving more. This will help you tackle new problems faster.",
  "Your streak shows dedication. Try exploring different topics to build a well-rounded skill set.",
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // For now, return a random insight
    // In production, you would call Groq API here
    const insight = defaultInsights[Math.floor(Math.random() * defaultInsights.length)];

    return NextResponse.json({ insight }, { status: 200 });
  } catch (error) {
    console.error("AI insight error:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}
