"use client";

import CountUp from "react-countup";
import { Trophy } from "lucide-react";

interface DifficultyCardProps {
  label: string;
  solved: number;
  total: number;
  beats: number;
  theme: "easy" | "medium" | "hard";
}

const themes = {
  easy: { gradient: "from-[#34D399] to-[#10B981]", badge: "badge-easy" },
  medium: { gradient: "from-[#FBBF24] to-[#F59E0B]", badge: "badge-medium" },
  hard: { gradient: "from-[#F87171] to-[#EF4444]", badge: "badge-hard" },
};

export function DifficultyCard({ label, solved, total, beats, theme }: DifficultyCardProps) {
  const t = themes[theme];
  const pct = total > 0 ? (solved / total) * 100 : 0;

  return (
    <div className="glass-card p-5">
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t.badge}`}>{label}</span>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[var(--text-primary)]">
          <CountUp end={solved} duration={1.8} enableScrollSpy />
        </span>
        <span className="text-sm text-[var(--text-muted)]">/ {total} problems</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${t.gradient} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
        <Trophy className="h-3.5 w-3.5 text-[var(--amber-400)]" />
        Beats {beats}% of all users
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{total - solved} remaining</p>
    </div>
  );
}
