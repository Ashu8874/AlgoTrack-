"use client";

import CountUp from "react-countup";

interface StatCardAcceptanceProps {
  rate: number;
  accepted: number;
  total: number;
}

export function StatCardAcceptance({ rate, accepted, total }: StatCardAcceptanceProps) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <div className="glass-card p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Acceptance Rate</p>
      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-20 w-20">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="url(#acceptGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="acceptGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[var(--text-primary)]">
            <CountUp end={rate} duration={1.8} suffix="%" enableScrollSpy />
          </span>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            <CountUp end={accepted} duration={1.8} separator="," enableScrollSpy /> accepted
          </p>
          <p className="text-sm text-[var(--text-muted)]">/ {total.toLocaleString()} submissions</p>
        </div>
      </div>
    </div>
  );
}
