import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-utils";
import { getDashboardData, getRecentSubmissions } from "@/lib/leetcode";
import { TopicsClient } from "./topics-client";

export default async function TopicsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");
  if (!user.leetcodeUsername) redirect("/dashboard/settings");

  const [{ topicStats, stats }, submissions] = await Promise.all([
    getDashboardData(user.leetcodeUsername).catch(() => ({ topicStats: null, stats: null } as const)),
    getRecentSubmissions(user.leetcodeUsername, 50).catch(() => []),
  ]);

  return (
    <TopicsClient
      username={user.leetcodeUsername}
      topicStats={topicStats}
      solvedStats={stats}
      submissions={submissions}
    />
  );
}
