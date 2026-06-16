import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { StudyPlan } from "@/models/StudyPlan";

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    await connectDB();

    const plan = await StudyPlan.findOne({ userId: user._id });
    if (!plan) {
      return NextResponse.json({ error: "No study plan found" }, { status: 404 });
    }

    plan.completedDays.push({
      date: new Date(body.date ?? Date.now()),
      week: body.week,
      day: body.day,
    });
    await plan.save();
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
