import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-utils";
import { getDashboardData } from "@/lib/leetcode";
import { ContestsClient } from "./contests-client";
import ContestAnalysis from "@/components/ai/ContestAnalysis";

export default async function ContestsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");
  if (!user.leetcodeUsername) redirect("/dashboard/settings");

  const { contest } = await getDashboardData(user.leetcodeUsername);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ContestAnalysis contestHistory={contest.userContestRankingHistory ?? []} />
      <ContestsClient contest={contest} username={user.leetcodeUsername} />
    </div>
  );
}
