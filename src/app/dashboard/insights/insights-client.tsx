"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { fadeUp } from "@/lib/animations";

interface Snapshot {
  date: string;
  totalSolved: number;
}

interface InsightsClientProps {
  snapshots: Snapshot[];
  username: string;
}

function groupByWeek(snapshots: Snapshot[]) {
  const weeks = new Map<string, { week: string; solved: number; target: number }>();
  snapshots.forEach((s, i) => {
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];
    const prev = i > 0 ? snapshots[i - 1].totalSolved : 0;
    const delta = s.totalSolved - prev;
    const existing = weeks.get(key);
    if (existing) {
      existing.solved += Math.max(0, delta);
    } else {
      weeks.set(key, {
        week: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        solved: Math.max(0, delta),
        target: 15,
      });
    }
  });
  return Array.from(weeks.values()).slice(-8);
}

export function InsightsClient({ snapshots, username }: InsightsClientProps) {
  const weeklyData = groupByWeek(snapshots);
  const totalGain =
    snapshots.length >= 2
      ? snapshots[snapshots.length - 1].totalSolved - snapshots[0].totalSolved
      : 0;

  return (
    <motion.div {...fadeUp} className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Insights</h1>
        <p className="text-[var(--text-secondary)]">@{username} — weekly velocity & trends</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Snapshots tracked", value: snapshots.length },
          { label: "Problems gained", value: totalGain },
          { label: "Weekly target", value: "15" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card chart-wrapper p-6">
        <h3 className="mb-4 text-lg font-semibold">Weekly Velocity</h3>
        {weeklyData.length < 2 ? (
          <p className="py-12 text-center text-sm text-[var(--text-muted)]">
            Sync your data over multiple days to see weekly trends
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <ChartGradients />
              <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
              <CustomTooltip />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#64748B"
                strokeDasharray="4 4"
                fill="none"
                isAnimationActive
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="solved"
                stroke="#7C3AED"
                fill="url(#purpleGrad)"
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
