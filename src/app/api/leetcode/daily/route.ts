import { NextResponse } from "next/server";
import { getDailyChallenge } from "@/lib/leetcode";

export async function GET() {
  try {
    const daily = await getDailyChallenge();
    if (!daily) {
      return NextResponse.json({ error: "Daily challenge not found" }, { status: 404 });
    }
    return NextResponse.json(daily);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch daily challenge" },
      { status: 500 },
    );
  }
}
