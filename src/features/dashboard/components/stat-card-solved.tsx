"use client";

import CountUp from "react-countup";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface StatCardSolvedProps {
  total: number;
  max: number;
  easy: number;
  medium: number;
  hard: number;
}

const COLORS = ["#34D399", "#FBBF24", "#F87171"];

export function StatCardSolved({ total, max, easy, medium, hard }: StatCardSolvedProps) {
  const data = [
    { name: "Easy", value: easy },
    { name: "Medium", value: medium },
    { name: "Hard", value: hard },
  ].filter((d) => d.value > 0);

  const pct = max > 0 ? (total / max) * 100 : 0;

  return (
    <div className="glass-card p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Total Solved</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-4xl font-bold text-[var(--text-primary)]">
          <CountUp end={total} duration={1.8} separator="," enableScrollSpy />
        </p>
        <div className="h-[60px] w-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.length ? data : [{ name: "Empty", value: 1 }]} innerRadius={18} outerRadius={28} dataKey="value" stroke="none">
                {data.length ? data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />) : <Cell fill="rgba(255,255,255,0.1)" />}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{total} / {max} total problems</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--purple-500)] to-[var(--cyan-400)] transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
