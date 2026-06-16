"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import type { ReactElement, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SolvedOverTimePoint = {
  label: string;
  solved: number;
};

type ContestRatingPoint = {
  label: string;
  rating: number;
};

type DailySubmissionPoint = {
  label: string;
  submissions: number;
};

type ChartPanelProps<T extends Record<string, number | string>> = {
  title: string;
  description: string;
  data: T[];
  children: ReactNode;
  className?: string;
};

function ChartPanel<T extends Record<string, number | string>>({
  title,
  description,
  data,
  children,
  className,
}: ChartPanelProps<T>) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            {children as ReactElement}
          </ResponsiveContainer>
        </div>
        {!data.length ? <p className="mt-3 text-sm text-muted-foreground">No chart data available.</p> : null}
      </CardContent>
    </Card>
  );
}

function chartTooltipFormatter(value: unknown) {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value ?? "--");
}

export type AnalyticsChartsProps = {
  solvedOverTime: SolvedOverTimePoint[];
  contestRatingOverTime: ContestRatingPoint[];
  dailySubmissionChart: DailySubmissionPoint[];
};

export function AnalyticsCharts({
  solvedOverTime,
  contestRatingOverTime,
  dailySubmissionChart,
}: AnalyticsChartsProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <ChartPanel
        data={solvedOverTime}
        description="Accepted problems accumulated over time. Uses mock points when historical data is unavailable."
        title="Solved Over Time"
      >
        <AreaChart data={solvedOverTime} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="solvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={42} />
          <Tooltip formatter={chartTooltipFormatter} />
          <Area
            type="monotone"
            dataKey="solved"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#solvedGradient)"
          />
        </AreaChart>
      </ChartPanel>

      <ChartPanel
        data={contestRatingOverTime}
        description="Contest rating trend across recent contests. Falls back to generated history if needed."
        title="Contest Rating Over Time"
      >
        <LineChart data={contestRatingOverTime} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={46} />
          <Tooltip formatter={chartTooltipFormatter} />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="hsl(var(--accent-foreground))"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartPanel>

      <ChartPanel
        className="xl:col-span-2"
        data={dailySubmissionChart}
        description="Daily submissions with a mock-data fallback when no submission history is returned."
        title="Daily Submission Chart"
      >
        <BarChart data={dailySubmissionChart} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={42} />
          <Tooltip formatter={chartTooltipFormatter} />
          <Bar dataKey="submissions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartPanel>
    </section>
  );
}

export type { ContestRatingPoint, DailySubmissionPoint, SolvedOverTimePoint };
