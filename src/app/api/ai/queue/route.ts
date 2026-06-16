import { NextResponse } from "next/server";
import { generateProblemQueue } from "@/lib/groq";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") ?? "user";
    const weakTopics = searchParams.get("weakTopics") ?? "Dynamic Programming, Graphs";
    const strongTopics = searchParams.get("strongTopics") ?? "Arrays, Hash Table";

    const queue = await generateProblemQueue(username, [], weakTopics, strongTopics);
    if (!queue) {
      return NextResponse.json({
        queue: [
          { title: "Two Sum", slug: "two-sum", difficulty: "Easy", topic: "Arrays", reason: "Warm-up", estimatedMinutes: 15 },
          { title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Easy", topic: "Stack", reason: "Pattern practice", estimatedMinutes: 15 },
          { title: "3Sum", slug: "3sum", difficulty: "Medium", topic: "Two Pointers", reason: "Core technique", estimatedMinutes: 25 },
          { title: "Longest Substring", slug: "longest-substring-without-repeating-characters", difficulty: "Medium", topic: "Sliding Window", reason: "Window pattern", estimatedMinutes: 25 },
          { title: "Merge Intervals", slug: "merge-intervals", difficulty: "Medium", topic: "Intervals", reason: "Interview staple", estimatedMinutes: 30 },
          { title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard", topic: "Two Pointers", reason: "Stretch goal", estimatedMinutes: 40 },
        ],
        totalEstimatedMinutes: 150,
        focusMessage: "Today's theme: strengthen weak areas with a progressive difficulty curve.",
      });
    }
    return NextResponse.json(queue);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
