import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-utils";
import { getContestInfo } from "@/lib/leetcode";
import { ContestsClient } from "./contests-client";

export default async function ContestsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");
  if (!user.leetcodeUsername) redirect("/dashboard/settings");

  const contest = await getContestInfo(user.leetcodeUsername);

  return <ContestsClient contest={contest} username={user.leetcodeUsername} />;
}
