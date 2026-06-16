import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-utils";
import { getSnapshotHistory } from "@/lib/repositories/legacy";
import { InsightsClient } from "./insights-client";

export default async function InsightsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");
  if (!user.leetcodeUsername) redirect("/dashboard/settings");

  const snapshots = await getSnapshotHistory(user.leetcodeUsername, 90);
  return <InsightsClient snapshots={snapshots} username={user.leetcodeUsername} />;
}
