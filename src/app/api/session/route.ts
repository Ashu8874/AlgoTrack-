import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { Session } from "@/models/Session";

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const sessions = await Session.find({ userId: user._id }).sort({ completedAt: -1 }).limit(100);
    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    await connectDB();
    const session = await Session.create({
      userId: user._id,
      problem: body.problem,
      problemSlug: body.problemSlug ?? "",
      difficulty: body.difficulty,
      durationSeconds: body.durationSeconds,
      solved: body.solved ?? false,
      hintsUsed: body.hintsUsed ?? 0,
      notes: body.notes ?? "",
      startedAt: new Date(body.startedAt),
      completedAt: new Date(body.completedAt ?? Date.now()),
    });
    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
