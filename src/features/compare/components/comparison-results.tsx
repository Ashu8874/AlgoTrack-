import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonReport } from "@/lib/analysis";
import { cn } from "@/lib/utils";

type ComparisonResultsProps = {
  report: ComparisonReport;
};

function formatDelta(value: number | null) {
  if (value === null) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
}

function MetricCard({
  label,
  value,
  delta,
  highlight,
}: {
  label: string;
  value: string;
  delta: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-background/40 p-4", highlight && "ring-1 ring-primary/60")}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
    </div>
  );
}

export function ComparisonResults({ report }: ComparisonResultsProps) {
  return (
    <section className="space-y-4">
      {report.rows.length ? (
        report.rows.map((row) => (
          <Card key={row.username}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>@{row.username}</CardTitle>
                {row.winnerMetrics.length ? (
                  <Badge variant="secondary">
                    Leading {row.winnerMetrics.map((metric) => report.metricNames[metric]).join(", ")}
                  </Badge>
                ) : null}
              </div>
              <CardDescription>Metric comparison against the current group.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Solved"
                  value={String(row.solved)}
                  delta={`Leader: ${report.leaders.solved ?? "--"} | Δ ${formatDelta(row.deltas.solved)}`}
                  highlight={report.leaders.solved === row.username}
                />
                <MetricCard
                  label="Rating"
                  value={row.rating === null ? "--" : row.rating.toFixed(0)}
                  delta={`Leader: ${report.leaders.rating ?? "--"} | Δ ${formatDelta(row.deltas.rating)}`}
                  highlight={report.leaders.rating === row.username}
                />
                <MetricCard
                  label="Ranking"
                  value={row.ranking === null ? "--" : String(row.ranking)}
                  delta={`Leader: ${report.leaders.ranking ?? "--"} | Δ ${formatDelta(row.deltas.ranking)}`}
                  highlight={report.leaders.ranking === row.username}
                />
                <MetricCard
                  label="Streak"
                  value={row.streak === null ? "--" : `${row.streak} days`}
                  delta={`Leader: ${report.leaders.streak ?? "--"} | Δ ${formatDelta(row.deltas.streak)}`}
                  highlight={report.leaders.streak === row.username}
                />
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Add two or more usernames to see the comparison.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
