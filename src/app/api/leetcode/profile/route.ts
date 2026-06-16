import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, getSolvedStats, getContestInfo, getSubmissionCalendar } from "@/lib/leetcode";
import { getCached, setCached } from "@/lib/redis";
import { saveSnapshot } from "@/lib/repositories/legacy";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const cacheKey = `api:profile:${username}`;
    const cached = await getCached<Record<string, unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const [profile, stats, contest, calendar] = await Promise.all([
      getUserProfile(username),
      getSolvedStats(username),
      getContestInfo(username),
      getSubmissionCalendar(username),
    ]);

    const ac = stats.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];
    const totalSolved = ac.find((e) => e.difficulty === "All")?.count ?? 0;
    const easySolved = ac.find((e) => e.difficulty === "Easy")?.count ?? 0;
    const mediumSolved = ac.find((e) => e.difficulty === "Medium")?.count ?? 0;
    const hardSolved = ac.find((e) => e.difficulty === "Hard")?.count ?? 0;

    await saveSnapshot(username, {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      rating: contest.userContestRanking?.rating ?? 0,
      streak: calendar.matchedUser?.userCalendar?.streak ?? 0,
      submissionCount: ac.find((e) => e.difficulty === "All")?.submissions ?? 0,
    });

    const result = { profile, stats, contest, calendar };
    await setCached(cacheKey, result, 300);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
