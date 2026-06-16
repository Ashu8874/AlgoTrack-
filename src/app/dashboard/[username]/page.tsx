import type { Metadata } from "next";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

type DashboardRouteProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: DashboardRouteProps): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `${username} Dashboard`,
    description: `LeetCode dashboard for ${username}.`,
  };
}

export default async function UserDashboardRoute({ params }: DashboardRouteProps) {
  const { username } = await params;
  return <DashboardPage username={username} />;
}
