"use client";

import CountUp from "react-countup";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardRatingProps {
  rating: number;
  globalRanking: number;
  history: Array<{ rating: number }>;
}

function getTier(rating: number) {
  if (rating >= 2200) return { label: "Guardian", color: "#A78BFA" };
  if (rating >= 1900) return { label: "Knight", color: "#8B5CF6" };
  if (rating >= 1600) return { label: "Expert", color: "#34D399" };
  if (rating >= 1400) return { label: "Specialist", color: "#FBBF24" };
  return { label: "Newbie", color: "#94A3B8" };
}

export function StatCardRating({ rating, globalRanking, history }: StatCardRatingProps) {
  const tier = getTier(rating);
  const sparkData = history.slice(-8).map((h, i) => ({ i, rating: h.rating }));

  return (
    <div className="glass-card p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Contest Rating</p>
      <div className="mt-2 flex items-center gap-3">
        <p className="text-4xl font-bold text-[var(--text-primary)]">
          <CountUp end={Math.round(rating)} duration={1.8} enableScrollSpy />
        </p>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44` }}>
          {tier.label}
        </span>
      </div>
      <div className="mt-2 h-[40px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line type="monotone" dataKey="rating" stroke="#A78BFA" strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">#{globalRanking.toLocaleString()} globally</p>
    </div>
  );
}
