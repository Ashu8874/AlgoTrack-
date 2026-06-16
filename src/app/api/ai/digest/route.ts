import { NextRequest, NextResponse } from "next/server";
import { generateDailyDigest } from "@/lib/groq";
import { getSolvedStats, getContestInfo, getSubmissionCalendar, getUserProfile } from "@/lib/leetcode";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const [profile, stats, contest, calendar] = await Promise.all([
      getUserProfile(username),
      getSolvedStats(username),
      getContestInfo(username),
      getSubmissionCalendar(username),
    ]);

    const ac = stats.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];
    const total = ac.find((e) => e.difficulty === "All")?.count ?? 0;
    const easy = ac.find((e) => e.difficulty === "Easy")?.count ?? 0;
    const medium = ac.find((e) => e.difficulty === "Medium")?.count ?? 0;
    const hard = ac.find((e) => e.difficulty === "Hard")?.count ?? 0;

    const digest = await generateDailyDigest(
      profile.profile?.realName ?? username,
      total,
      easy,
      medium,
      hard,
      contest.userContestRanking?.rating ?? 0,
      contest.userContestRanking?.globalRanking ?? 0,
      calendar.matchedUser?.userCalendar?.streak ?? 0,
      "Dynamic Programming, Graphs",
    );

    return NextResponse.json({ digest: digest ?? "Keep grinding — consistency is your edge today." });
  } catch (error) {
    return NextResponse.json(
      { digest: "Your progress is building. Focus on one topic deeply today." },
      { status: 200 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, stats } = body;

    if (!username || !stats) {
      return NextResponse.json({ error: "Username and stats required" }, { status: 400 });
    }

    const digest = await generateDailyDigest(
      username,
      stats.total || 0,
      stats.easy || 0,
      stats.medium || 0,
      stats.hard || 0,
      stats.rating || 0,
      stats.rank || 0,
      stats.streak || 0,
      stats.weakTopics || "None identified",
    );

    if (!digest) {
      return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
    }

    return NextResponse.json({ digest });
  } catch {
    return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
  }
}
