import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/repositories";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default async function DashboardPage() {
  console.log("\n📊 [DASHBOARD] Page loading");
  
  const session = await auth();
  console.log("📊 [DASHBOARD] Session:", { hasSession: !!session, email: session?.user?.email });

  if (!session?.user?.email) {
    console.log("❌ [DASHBOARD] No session, redirecting to login");
    redirect("/auth/login");
  }

  try {
    const user = await getUser({ email: session.user.email });
    console.log("📊 [DASHBOARD] User found:", { email: user?.email, hasUsername: !!user?.leetcodeUsername });

    if (!user?.leetcodeUsername) {
      console.log("⚠️ [DASHBOARD] No LeetCode username, redirecting to settings");
      redirect("/dashboard/settings");
    }

    // Simple dashboard for now
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="text-muted-foreground mt-2">
              LeetCode Username: @{user.leetcodeUsername}
            </p>
          </div>
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Dashboard content cards */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Progress Overview</h3>
            <p className="text-sm text-muted-foreground">
              Your LeetCode progress tracking dashboard is ready!
            </p>
            <div className="mt-4">
              <p className="text-2xl font-bold text-primary">Connected</p>
              <p className="text-xs text-muted-foreground">Account: @{user.leetcodeUsername}</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Quick Stats</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View your problem-solving statistics
            </p>
            <Button className="w-full" disabled>
              Loading stats...
            </Button>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">AI Insights</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get personalized recommendations
            </p>
            <Button className="w-full" disabled>
              Coming soon
            </Button>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            🎉 Your LeetCode account is connected!
          </h2>
          <p className="text-muted-foreground">
            We&apos;re currently building out the full dashboard experience with charts, analytics, 
            and AI-powered insights. Check back soon for updates!
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ [DASHBOARD] Error:", error);
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/settings">
              <Button>Go to Settings</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline">Back to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
