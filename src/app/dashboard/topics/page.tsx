import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-utils";
import { getTopicStats, getSolvedStats, getRecentSubmissions } from "@/lib/leetcode";
import { TopicsClient } from "./topics-client";

export default async function TopicsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");
  if (!user.leetcodeUsername) redirect("/dashboard/settings");

  const [topicStats, solvedStats, submissions] = await Promise.all([
    getTopicStats(user.leetcodeUsername).catch(() => null),
    getSolvedStats(user.leetcodeUsername).catch(() => null),
    getRecentSubmissions(user.leetcodeUsername, 50).catch(() => []),
  ]);

  return (
    <TopicsClient
      username={user.leetcodeUsername}
      topicStats={topicStats}
      solvedStats={solvedStats}
      submissions={submissions}
    />
  );
}
