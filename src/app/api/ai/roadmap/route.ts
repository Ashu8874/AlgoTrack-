import { NextResponse } from "next/server";
import { z } from "zod";

const roadmapSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  duration: z.number().min(1),
});

const sampleRoadmaps: Record<string, string> = {
  google:
    "Week 1-2: Arrays & Strings basics\nWeek 3-4: Linked Lists & Stacks\nWeek 5-6: Trees & Graphs\nWeek 7-8: DP & System Design",
  meta: "Week 1-2: String manipulation & hashing\nWeek 3-4: Tree traversal & BST\nWeek 5-6: Graph algorithms\nWeek 7-8: DP patterns",
  amazon:
    "Week 1-2: Array operations\nWeek 3-4: Trees & recursion\nWeek 5-6: Graphs & sorting\nWeek 7-8: System design",
  default:
    "Week 1: Fundamentals (Arrays, Strings)\nWeek 2: Data Structures (Lists, Trees)\nWeek 3: Algorithms (Sorting, Searching)\nWeek 4+: Advanced topics (DP, Graphs, System Design)",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, role, duration } = roadmapSchema.parse(body);

    // Simple roadmap generation (in production, use Groq API)
    const companyKey = company.toLowerCase();
    const baseRoadmap = sampleRoadmaps[companyKey] || sampleRoadmaps.default;

    // Adjust for duration
    const adjustedRoadmap = `${role} @ ${company} - ${duration} Week Preparation Plan\n\n${baseRoadmap}\n\nTips:\n- Solve 2-3 problems daily\n- Focus on understanding patterns\n- Review failed attempts`;

    return NextResponse.json(
      { roadmap: adjustedRoadmap },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
