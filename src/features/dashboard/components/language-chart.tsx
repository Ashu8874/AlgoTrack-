"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { CustomTooltip } from "@/components/charts/custom-tooltip";

interface LanguageChartProps {
  languages: Array<{ language: string; solved: number }>;
}

export function LanguageChart({ languages }: LanguageChartProps) {
  const data = languages.slice(0, 8);
  const height = data.length * 48 + 80;

  if (!data.length) {
    return (
      <div className="glass-card flex h-48 items-center justify-center p-6">
        <p className="text-sm text-[var(--text-muted)]">No language data available</p>
      </div>
    );
  }

  return (
    <div className="glass-card chart-wrapper p-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Language Stats</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 60 }}>
          <ChartGradients />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="language" width={100} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
          <CustomTooltip />
          <Bar dataKey="solved" fill="url(#barGrad)" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={800} animationEasing="ease-out">
            <LabelList dataKey="solved" position="right" fill="#94A3B8" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
