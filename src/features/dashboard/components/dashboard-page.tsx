import { getDashboardData } from "@/lib/leetcode";
import { getSnapshotHistory } from "@/lib/repositories/legacy";
import { getGoals, getUser } from "@/lib/repositories";
import { DashboardHome } from "./dashboard-home";
import { Ghost } from "lucide-react";
import Link from "next/link";

type DashboardPageProps = {
  username: string;
};

export async function DashboardPage({ username }: DashboardPageProps) {
  try {
    const [{ profile, stats, contest, calendar, topicStats, languages, beats }, snapshots] = await Promise.all([
      getDashboardData(username),
      getSnapshotHistory(username, 60),
    ]);

    await getUser({ leetcodeUsername: username });

    return (
      <DashboardHome
        username={username}
        displayName={profile.profile?.realName ?? username}
        profile={profile}
        stats={stats}
        contest={contest}
        calendar={calendar}
        topicStats={topicStats}
        languages={languages}
        beats={beats}
        snapshots={snapshots}
      />
    );
  } catch {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <Ghost className="h-16 w-16 text-[var(--text-muted)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">User not found on LeetCode</h2>
        <p className="text-[var(--text-secondary)]">Could not fetch data for @{username}</p>
        <Link href="/dashboard/settings" className="rounded-lg bg-[var(--purple-500)] px-4 py-2 text-sm font-medium text-white">
          Try a different username
        </Link>
      </div>
    );
  }
}
