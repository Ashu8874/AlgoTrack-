import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-utils";
import { getSnapshotHistory } from "@/lib/repositories/legacy";
import { getDashboardData } from "@/lib/leetcode";
import ChartNarrator from "@/components/ai/ChartNarrator";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";

export default async function ChartsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");
  if (!user.leetcodeUsername) redirect("/dashboard/settings");

  const [{ stats, contest, calendar, topicStats }, snapshots] = await Promise.all([
    getDashboardData(user.leetcodeUsername),
    getSnapshotHistory(user.leetcodeUsername, 120),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
        <p className="text-[var(--text-secondary)]">Deep visual breakdown of your progress and contest performance</p>
      </div>
      <DashboardCharts
        stats={stats}
        contest={contest}
        calendar={calendar}
        topicStats={topicStats}
        snapshots={snapshots}
      />
      <div className="mt-6">
        <ChartNarrator chartType="Dashboard Overview" chartData={{ stats, contest, calendar, topicStats, snapshots }} />
      </div>
    </div>
  );
}
