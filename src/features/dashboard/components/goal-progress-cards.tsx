import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GoalProgressItem = {
  id: string;
  title: string;
  description?: string;
  progressPercentage: number;
  currentCount: number;
  targetCount: number;
  status: string;
};

type GoalProgressCardsProps = {
  goals: GoalProgressItem[];
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function GoalProgressCards({ goals }: GoalProgressCardsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>Track study targets with progress bars, status, and completion percent.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {goals.length ? (
              goals.map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-border/70 bg-background/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{goal.title}</p>
                        <Badge variant="secondary" className={cn(goal.status === "completed" && "bg-emerald-500/15 text-emerald-300")}>
                          {goal.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{goal.description ?? "No description provided."}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{goal.progressPercentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.currentCount} / {goal.targetCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <ProgressBar value={goal.progressPercentage} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No goals yet. Add your first goal to start tracking progress.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
