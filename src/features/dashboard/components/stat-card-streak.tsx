"use client";

import CountUp from "react-countup";
import { BarChart, Bar, ResponsiveContainer } from "recharts";

interface StatCardStreakProps {
  streak: number;
  maxStreak: number;
  last7Days: Array<{ day: string; count: number }>;
}

export function StatCardStreak({ streak, maxStreak, last7Days }: StatCardStreakProps) {
  return (
    <div className="glass-card p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Current Streak</p>
      <p className="mt-2 text-4xl font-bold text-[var(--text-primary)]">
        🔥 <CountUp end={streak} duration={1.8} enableScrollSpy />
      </p>
      <div className="mt-2 h-[40px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days}>
            <Bar dataKey="count" fill="#7C3AED" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Max streak: {maxStreak} days</p>
    </div>
  );
}
