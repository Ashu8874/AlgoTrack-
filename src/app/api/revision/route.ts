import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { Revision } from "@/models/Revision";

const INTERVALS = [1, 3, 7, 14, 30];

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const revisions = await Revision.find({
      userId: user._id,
      nextReviewDate: { $lte: today },
    }).sort({ nextReviewDate: 1 });
    const all = await Revision.find({ userId: user._id }).sort({ nextReviewDate: 1 });
    return NextResponse.json({
      dueToday: revisions,
      all,
      total: all.length,
      mastered: all.filter((r) => r.repetitions >= 5).length,
      forgotten: all.filter((r) => r.history.filter((h: { result: string }) => h.result === "fail").length >= 2).length,
    });
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

    let revision = await Revision.findOne({
      userId: user._id,
      problemSlug: body.problemSlug,
    });

    const result = body.result as "pass" | "fail";
    const now = new Date();

    if (!revision) {
      const nextInterval = result === "pass" ? INTERVALS[0] : 1;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextInterval);
      revision = await Revision.create({
        userId: user._id,
        problemSlug: body.problemSlug,
        problemTitle: body.problemTitle,
        difficulty: body.difficulty,
        nextReviewDate: nextDate,
        interval: nextInterval,
        repetitions: result === "pass" ? 1 : 0,
        easeFactor: 2.5,
        history: [{ date: now, result }],
      });
      return NextResponse.json({ revision });
    }

    revision.history.push({ date: now, result });
    if (result === "pass") {
      revision.repetitions += 1;
      const idx = Math.min(revision.repetitions - 1, INTERVALS.length - 1);
      revision.interval = INTERVALS[idx];
    } else {
      revision.repetitions = 0;
      revision.interval = 1;
    }
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + revision.interval);
    revision.nextReviewDate = nextDate;
    await revision.save();
    return NextResponse.json({ revision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
