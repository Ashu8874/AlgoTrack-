import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthUser } from "@/lib/auth-utils";
import { User } from "@/models/user";
import { getFriendsProfiles } from "@/lib/leetcode";

function parseCalendar(calendarJson?: string) {
  if (!calendarJson) return new Map<string, number>();
  try {
    const parsed = JSON.parse(calendarJson) as Record<string, number>;
    const map = new Map<string, number>();
    Object.entries(parsed).forEach(([ts, count]) => {
      const d = new Date(parseInt(ts, 10) * 1000);
      const key = d.toISOString().split("T")[0];
      map.set(key, (map.get(key) ?? 0) + count);
    });
    return map;
  } catch {
    return new Map<string, number>();
  }
}

function weekSolved(calendarJson?: string) {
  const map = parseCalendar(calendarJson);
  const now = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    total += map.get(key) ?? 0;
  }
  return total;
}

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const freshUser = await User.findById(user._id);
    const friends = freshUser?.friends ?? [];
    const usernames = [
      user.leetcodeUsername,
      ...friends.map((f: { leetcodeUsername: string }) => f.leetcodeUsername),
    ].filter(Boolean);

    const profiles = await getFriendsProfiles(usernames);
    const leaderboard = profiles.map((p) => {
      const ac =
        p.stats?.matchedUser?.submitStatsGlobal?.acSubmissionNum ??
        p.stats?.matchedUser?.submitStats?.acSubmissionNum ??
        [];
      const easy = ac.find((e) => e.difficulty === "Easy")?.count ?? 0;
      const medium = ac.find((e) => e.difficulty === "Medium")?.count ?? 0;
      const hard = ac.find((e) => e.difficulty === "Hard")?.count ?? 0;
      const total = ac.find((e) => e.difficulty === "All")?.count ?? easy + medium + hard;
      return {
        username: p.username,
        avatar: p.profile?.profile?.userAvatar ?? "",
        realName: p.profile?.profile?.realName ?? p.username,
        totalSolved: total,
        rating: p.contest?.userContestRanking?.rating ?? 0,
        streak: p.calendar?.matchedUser?.userCalendar?.streak ?? 0,
        thisWeek: weekSolved(p.calendar?.matchedUser?.userCalendar?.submissionCalendar),
        easy,
        medium,
        hard,
        isCurrentUser: p.username === user.leetcodeUsername,
      };
    });

    leaderboard.sort((a, b) => b.totalSolved - a.totalSolved);
    return NextResponse.json({ leaderboard });
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
    const username = body.leetcodeUsername?.trim();
    if (!username) {
      return NextResponse.json({ error: "leetcodeUsername required" }, { status: 400 });
    }
    await connectDB();
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { friends: { leetcodeUsername: username, addedAt: new Date() } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
