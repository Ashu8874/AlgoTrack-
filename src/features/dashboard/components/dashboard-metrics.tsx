import { type LucideIcon, Award, Flame, ListChecks, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardMetricCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

function DashboardMetricCard({ title, value, description, icon: Icon }: DashboardMetricCardProps) {
  return (
    <Card className="min-h-[148px]">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-3xl sm:text-4xl">{value}</CardTitle>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/40 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export type DashboardMetricsProps = {
  totalSolved: number;
  ranking: number | null;
  contestRating: number | null;
  streak: number | null;
};

function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export function DashboardMetrics({
  totalSolved,
  ranking,
  contestRating,
  streak,
}: DashboardMetricsProps) {
  const cards: DashboardMetricCardProps[] = [
    {
      title: "Total solved",
      value: formatNumber(totalSolved),
      description: "Accepted submissions across all tracked difficulty levels.",
      icon: ListChecks,
    },
    {
      title: "Ranking",
      value: formatNumber(ranking),
      description: "Current profile ranking from your LeetCode public profile.",
      icon: Award,
    },
    {
      title: "Contest rating",
      value: contestRating !== null && contestRating !== undefined ? contestRating.toFixed(0) : "--",
      description: "Contest rating from the latest public ranking snapshot.",
      icon: Trophy,
    },
    {
      title: "Streak",
      value: streak !== null && streak !== undefined ? `${formatNumber(streak)} days` : "--",
      description: "Submission streak from your profile calendar.",
      icon: Flame,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <DashboardMetricCard key={card.title} {...card} />
      ))}
    </section>
  );
}
