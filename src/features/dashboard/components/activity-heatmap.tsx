"use client";

import type { LeetCodeSubmissionCalendar } from "@/lib/leetcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

type ActivityHeatmapProps = {
  submissions: LeetCodeSubmissionCalendar | null;
};

export function ActivityHeatmap({ submissions }: ActivityHeatmapProps) {
  const today = new Date();
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Parse submission calendar data
  const submissionMap = new Map<string, number>();
  if (submissions?.matchedUser?.userCalendar?.submissionCalendar) {
    Object.entries(submissions.matchedUser.userCalendar.submissionCalendar).forEach(
      ([timestamp, count]) => {
        const date = new Date(parseInt(timestamp) * 1000);
        const dateStr = date.toISOString().split("T")[0];
        submissionMap.set(dateStr, Number(count));
      }
    );
  }

  // Generate dates for the last year
  const dates: Date[] = [];
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  // Group dates by week
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Add padding for the first day of the week
  const firstDayOfWeek = oneYearAgo.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  dates.forEach((date) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(date);
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-slate-800";
    if (count === 1) return "bg-green-900";
    if (count === 2) return "bg-green-700";
    if (count === 3) return "bg-green-600";
    return "bg-green-500";
  };

  return (
    <Card className="glass border-border/50 bg-gradient-to-br from-green-600/10 to-green-700/10 col-span-1">
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
        <CardDescription>Last 365 days of submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((date, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    whileHover={date ? { scale: 1.2 } : {}}
                    className={`h-3 w-3 rounded-sm ${
                      date ? getColor(submissionMap.get(date.toISOString().split("T")[0]) || 0) : ""
                    }`}
                    title={date ? `${date.toLocaleDateString()}: ${submissionMap.get(date.toISOString().split("T")[0]) || 0} submissions` : ""}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-sm ${getColor(i)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
