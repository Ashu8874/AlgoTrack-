import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { MockInterview } from "@/models/MockInterview";

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const interviews = await MockInterview.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .limit(50);
    return NextResponse.json({ interviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
