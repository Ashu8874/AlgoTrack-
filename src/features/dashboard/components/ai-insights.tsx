import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProfileInsight } from "@/lib/ai";

type AiInsightsProps = {
  insight: ProfileInsight;
};

function scoreLabel(score: number) {
  if (score >= 80) return "Highly ready";
  if (score >= 60) return "Ready with gaps";
  if (score >= 40) return "Building momentum";
  return "Early stage";
}

function readinessRingClass(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-sky-400";
  return "text-rose-400";
}

export function AiInsights({ insight }: AiInsightsProps) {
  const readinessScore = Math.round(insight.confidence);

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Readiness Score</CardTitle>
          <CardDescription>AI-estimated interview readiness based on the current LeetCode signal.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <div className={cn("flex h-24 w-24 items-center justify-center rounded-full border-8 border-border/60 text-2xl font-semibold", readinessRingClass(readinessScore))}>
            {readinessScore}
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">{scoreLabel(readinessScore)}</Badge>
            <p className="text-sm text-muted-foreground">{insight.summary}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strengths and Weaknesses</CardTitle>
          <CardDescription>Groq-generated coaching points for the current profile.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">Strengths</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {insight.strengths.map((item) => (
                <li key={item} className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-400">Weaknesses</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {insight.weaknesses.map((item) => (
                <li key={item} className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Suggested Topics</CardTitle>
          <CardDescription>Topics the AI thinks are worth prioritizing next.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {insight.focusAreas.length ? (
            insight.focusAreas.map((topic) => (
              <Badge key={topic} variant="outline" className="rounded-full px-3 py-1 text-sm">
                {topic}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No suggested topics yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
