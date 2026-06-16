import { Activity, CheckCircle2, Flame, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "./metric-card";

const highlights = [
  {
    title: "Solved today",
    value: "12",
    delta: "+3 vs yesterday",
    icon: CheckCircle2,
  },
  {
    title: "Current streak",
    value: "18 days",
    delta: "Keep the momentum alive",
    icon: Flame,
  },
  {
    title: "Active topics",
    value: "7",
    delta: "Dynamic by weakness",
    icon: Activity,
  },
  {
    title: "Rank movement",
    value: "+42",
    delta: "Weekly improvement",
    icon: Trophy,
  },
];

export function DashboardShell() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header className="rounded-[2rem] border border-border/70 bg-card/70 p-4 shadow-glow backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary">LeetCode Progress Analyzer</Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Track practice with a clean, focused dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  A production-ready shell for progress metrics, topic trends, and future LeetCode integrations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline">Sync account</Button>
              <Button>Open analytics</Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <MetricCard key={item.title} {...item} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Progress overview</CardTitle>
              <CardDescription>Reserved for charts, streak timelines, and difficulty breakdowns.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {["Easy", "Medium", "Hard"].map((label) => (
                  <div key={label} className="rounded-2xl border border-border/70 bg-background/40 p-4">
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <div className="mt-2 text-2xl font-semibold">--</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>Foundation in place for API ingestion and persisted analytics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Connect MongoDB to store user progress snapshots",
                "Use Redis for caching leaderboard and trend data",
                "Add LeetCode data pipelines later",
              ].map((step) => (
                <div key={step} className="rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
