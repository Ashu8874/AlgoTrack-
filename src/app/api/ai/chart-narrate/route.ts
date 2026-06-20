import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import { buildAIContext } from "@/lib/aiContext";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = (await User.findOne({ email: session.user.email }).lean()) as any;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const chartType = String(body.chartType ?? "daily");
    const chartData = body.chartData ?? {};
    const userId = (user as any)?._id?.toString?.();
    const context = await buildAIContext(userId);

    let prompt = "";
    if (chartType === "daily") {
      prompt = `Analyze this daily activity data in 2 sentences. Tell the user their consistency pattern and one tip. Data: ${JSON.stringify(chartData)}`;
    } else if (chartType === "topics") {
      prompt = `Analyze this topic distribution in 2 sentences. Tell the user their biggest imbalance and what to fix. Data: ${JSON.stringify(chartData)}`;
    } else if (chartType === "rating") {
      prompt = `Analyze this contest rating history in 2 sentences. Tell the user their trend and one actionable tip. Data: ${JSON.stringify(chartData)}`;
    } else if (chartType === "radar") {
      prompt = `Analyze this skill radar in 2 sentences. Tell the user their most underdeveloped skill area. Data: ${JSON.stringify(chartData)}`;
    } else {
      prompt = `Analyze this chart data in 2 sentences. Data: ${JSON.stringify(chartData)}`;
    }

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 250,
      messages: [{ role: "user", content: `${context}\n\n${prompt}` }],
    });

    const analysis = String(message.choices[0]?.message?.content ?? "").trim();
    if (!analysis) {
      throw new Error("AI returned empty analysis");
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze chart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
