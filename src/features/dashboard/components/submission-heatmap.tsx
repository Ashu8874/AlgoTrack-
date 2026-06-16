"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

interface SubmissionHeatmapProps {
  submissionCalendar: string | undefined;
  streak: number;
  maxStreak: number;
  totalActiveDays: number;
  year: number;
}

function getColor(count: number) {
  if (count === 0) return "rgba(255,255,255,0.04)";
  if (count <= 2) return "rgba(124,58,237,0.3)";
  if (count <= 5) return "rgba(124,58,237,0.6)";
  if (count <= 9) return "rgba(124,58,237,0.85)";
  return "#7C3AED";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

export function SubmissionHeatmap({
  submissionCalendar,
  streak,
  maxStreak,
  totalActiveDays,
  year,
}: SubmissionHeatmapProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const { weeks, totalSubmissions } = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    if (submissionCalendar) {
      try {
        const parsed = JSON.parse(submissionCalendar) as Record<string, number>;
        Object.entries(parsed).forEach(([ts, count]) => {
          const d = new Date(parseInt(ts, 10) * 1000);
          if (d.getFullYear() === year) {
            const key = d.toISOString().split("T")[0];
            map.set(key, (map.get(key) ?? 0) + count);
            total += count;
          }
        });
      } catch { /* empty */ }
    }

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const weeksArr: Array<Array<{ date: Date | null; count: number }>> = [];
    let week: Array<{ date: Date | null; count: number }> = [];

    const pad = (start.getDay() + 6) % 7;
    for (let i = 0; i < pad; i++) week.push({ date: null, count: 0 });

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const key = date.toISOString().split("T")[0];
      week.push({ date, count: map.get(key) ?? 0 });
      if (week.length === 7) {
        weeksArr.push(week);
        week = [];
      }
    }
    if (week.length) weeksArr.push(week);

    return { weeks: weeksArr, totalSubmissions: total };
  }, [submissionCalendar, year]);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Submission Activity — {year}
      </h3>
      {tooltip && (
        <p className="mt-1 text-xs text-[var(--purple-300)]">{tooltip}</p>
      )}
      <div className="mt-4 overflow-x-auto">
        <div className="flex gap-3">
          <div className="flex flex-col gap-[3px] pt-5">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="flex h-[10px] items-center text-[10px] text-[var(--text-muted)]">
                {label}
              </div>
            ))}
          </div>
          <div>
            <div className="mb-1 flex gap-[3px]">
              {MONTHS.map((m) => (
                <span key={m} className="w-[46px] text-[10px] text-[var(--text-muted)]">{m}</span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell, di) => (
                    <motion.div
                      key={`${wi}-${di}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(wi * 0.01, 0.2) }}
                      className="h-[10px] w-[10px] rounded-[2px]"
                      style={{ background: cell.date ? getColor(cell.count) : "transparent" }}
                      onMouseEnter={() => {
                        if (cell.date) {
                          setTooltip(
                            `${cell.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} — ${cell.count} submissions`,
                          );
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: `${totalActiveDays} active days`, color: "var(--purple-400)" },
          { label: `Current streak: ${streak} days`, color: "var(--cyan-400)" },
          { label: `Max streak: ${maxStreak} days`, color: "var(--green-400)" },
          { label: `Total submissions: ${totalSubmissions}`, color: "var(--amber-400)" },
        ].map((pill) => (
          <span
            key={pill.label}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)]"
            style={{ borderColor: `${pill.color}33` }}
          >
            {pill.label}
          </span>
        ))}
      </div>
    </div>
  );
}
