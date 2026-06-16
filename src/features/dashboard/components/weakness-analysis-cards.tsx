import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeaknessAnalysis } from "@/lib/analysis";

type WeaknessAnalysisCardsProps = {
  analysis: WeaknessAnalysis;
};

function TopicList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: WeaknessAnalysis["weakestTopics"];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((topic) => (
            <li
              key={topic.slug}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{topic.name}</p>
                <p className="text-xs text-muted-foreground">{topic.category}</p>
              </div>
              <Badge variant="outline">{topic.solved}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

export function WeaknessAnalysisCards({ analysis }: WeaknessAnalysisCardsProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Weakest Topics</CardTitle>
          <CardDescription>Lowest solved-count topics across your topic taxonomy.</CardDescription>
        </CardHeader>
        <CardContent>
          <TopicList items={analysis.weakestTopics} title="Bottom by volume" emptyLabel="No topic data available." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neglected Topics</CardTitle>
          <CardDescription>
            Topics solved below the analysis threshold of {analysis.summary.neglectedThreshold}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicList items={analysis.neglectedTopics} title="Below threshold" emptyLabel="No neglected topics detected." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Low-Attempt Areas</CardTitle>
          <CardDescription>
            Topics with low solved volume or a tiny share of total topic solves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicList items={analysis.lowAttemptAreas} title="Low volume" emptyLabel="No low-attempt areas detected." />
        </CardContent>
      </Card>
    </section>
  );
}
