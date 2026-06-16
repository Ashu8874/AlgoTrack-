"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, ChevronDown, ChevronUp, Clock, ExternalLink, Sparkles } from "lucide-react";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface DailyChallenge {
  date: string;
  link: string;
  title: string;
  difficulty: string;
  titleSlug: string;
  topics: string[];
}

interface DailyRecord {
  date: string;
  titleSlug: string;
  title: string;
  difficulty: string;
  solved: boolean;
  solveTimeMinutes?: number;
}

const STORAGE_KEY = "lc-daily-records";
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#34D399",
  Medium: "#FBBF24",
  Hard: "#F87171",
};

function difficultyBadge(difficulty: string) {
  const key = difficulty.toLowerCase();
  if (key === "easy") return "badge-easy";
  if (key === "hard") return "badge-hard";
  return "badge-medium";
}

function getMidnightUtcMs() {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return midnight.getTime();
}

function loadRecords(): DailyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DailyRecord[]) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: DailyRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function calcStreak(records: DailyRecord[]) {
  const solvedDates = new Set(records.filter((r) => r.solved).map((r) => r.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split("T")[0];
    if (solvedDates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function DailyPage() {
  const [daily, setDaily] = useState<DailyChallenge | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [solveStart, setSolveStart] = useState<number | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DailyRecord | null>(null);

  const fetchDaily = useCallback(async () => {
    try {
      const res = await fetch("/api/leetcode/daily");
      if (!res.ok) throw new Error("Failed to fetch daily challenge");
      const data = (await res.json()) as DailyChallenge;
      setDaily(data);
      setSolveStart(Date.now());
    } catch {
      setDaily(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRecords(loadRecords());
    void fetchDaily();
  }, [fetchDaily]);

  useEffect(() => {
    function tick() {
      const diff = getMidnightUtcMs() - Date.now();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySolved = records.some((r) => r.date === todayStr && r.solved);

  const stats = useMemo(() => {
    const solved = records.filter((r) => r.solved);
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = solved.filter((r) => r.date.startsWith(monthStart)).length;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const byMonth = new Map<string, number>();
    solved.forEach((r) => {
      const m = r.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
    });
    const bestMonth = Math.max(...Array.from(byMonth.values()), 0);

    return {
      streak: calcStreak(records),
      total: solved.length,
      thisMonth,
      daysInMonth,
      bestMonth,
    };
  }, [records]);

  const difficultyData = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    records.filter((r) => r.solved).forEach((r) => {
      const key = r.difficulty as keyof typeof counts;
      if (key in counts) counts[key]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [records]);

  const solveTimeByMonth = useMemo(() => {
    const map = new Map<string, number[]>();
    records
      .filter((r) => r.solved && r.solveTimeMinutes)
      .forEach((r) => {
        const m = r.date.slice(0, 7);
        const arr = map.get(m) ?? [];
        arr.push(r.solveTimeMinutes!);
        map.set(m, arr);
      });
    const months = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, times]) => ({
        month,
        avg: Math.round(times.reduce((s, t) => s + t, 0) / times.length),
      }));
    return months.length ? months : [{ month: "No data", avg: 0 }];
  }, [records]);

  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number; date: string; status: "future" | "today" | "solved" | "missed" }> = [];

    for (let i = 0; i < firstDay; i++) cells.push({ day: 0, date: "", status: "future" });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday = date === todayStr;
      const isFuture = new Date(date) > now;
      const record = records.find((r) => r.date === date && r.solved);
      let status: "future" | "today" | "solved" | "missed" = "missed";
      if (isFuture) status = "future";
      else if (isToday) status = "today";
      else if (record) status = "solved";
      cells.push({ day: d, date, status });
    }
    return cells;
  }, [records, todayStr]);

  function handleSolve() {
    if (!daily || todaySolved) return;
    const minutes = solveStart ? Math.max(1, Math.round((Date.now() - solveStart) / 60000)) : 15;
    const record: DailyRecord = {
      date: todayStr,
      titleSlug: daily.titleSlug,
      title: daily.title,
      difficulty: daily.difficulty,
      solved: true,
      solveTimeMinutes: minutes,
    };
    const updated = [...records.filter((r) => r.date !== todayStr), record];
    setRecords(updated);
    saveRecords(updated);
  }

  async function fetchHint(type: "nudge" | "approach") {
    if (!daily) return;
    setHintLoading(true);
    setHintCount((c) => c + 1);
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: `${daily.title} (${daily.difficulty}) - topics: ${daily.topics.join(", ")}`, type }),
      });
      const data = (await res.json()) as { hint?: string };
      setHint(data.hint ?? "Try breaking the problem into smaller subproblems.");
    } catch {
      setHint("Think about what data structure fits the constraints.");
    } finally {
      setHintLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 p-6 lg:p-8" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp}>
        <h1 className="text-3xl font-bold gradient-text">Daily Challenge</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Track streaks, solve times, and get AI hints</p>
      </motion.div>

      {daily && (
        <motion.div {...fadeUp} className="glass-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[var(--bg-surface)] px-3 py-1.5 text-sm">
            <Clock className="h-4 w-4 text-[var(--purple-300)]" />
            <span className="font-mono text-[var(--cyan-400)]">Resets in {countdown}</span>
          </div>

          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Today&apos;s Challenge</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">{daily.title}</h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", difficultyBadge(daily.difficulty))}>
              {daily.difficulty}
            </span>
            {daily.topics.map((t) => (
              <span key={t} className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={daily.link} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open on LeetCode
              </Link>
            </Button>
            <Button
              variant={todaySolved ? "secondary" : "default"}
              onClick={handleSolve}
              disabled={todaySolved}
              className={todaySolved ? "bg-[var(--green-400)]/20 text-[var(--green-400)]" : ""}
            >
              <Check className="mr-2 h-4 w-4" />
              {todaySolved ? "Solved! ✓" : "I solved it! ✓"}
            </Button>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() => setHintOpen((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-[var(--text-secondary)]"
            >
              <span>🤔 Need a hint? {hintCount > 0 && <span className="text-[var(--text-muted)]">({hintCount} used)</span>}</span>
              {hintOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <AnimatePresence>
              {hintOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => void fetchHint("nudge")} disabled={hintLoading}>
                      <Sparkles className="mr-1 h-3 w-3" />
                      Small nudge
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void fetchHint("approach")} disabled={hintLoading}>
                      💡 Give me the approach
                    </Button>
                  </div>
                  {hintLoading ? (
                    <Skeleton className="mt-3 h-12 w-full" />
                  ) : hint ? (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{hint}</p>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      <motion.div {...fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Daily Streak", value: `${stats.streak} days`, color: "#FBBF24" },
          { label: "Total Completed", value: stats.total, color: "#34D399" },
          { label: "This Month", value: `${stats.thisMonth}/${stats.daysInMonth}`, color: "#22D3EE" },
          { label: "Best Month", value: `${stats.bestMonth}/31`, color: "#A78BFA" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{s.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div {...fadeUp} className="glass-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1 text-[var(--text-muted)]">{d}</div>
            ))}
            {calendarDays.map((cell, i) => (
              <button
                key={i}
                type="button"
                disabled={!cell.day}
                onClick={() => {
                  const rec = records.find((r) => r.date === cell.date);
                  if (rec) setSelectedDay(rec);
                }}
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                  !cell.day && "invisible",
                  cell.status === "solved" && "bg-[rgba(52,211,153,0.15)] text-[var(--green-400)]",
                  cell.status === "missed" && cell.day && "bg-[rgba(248,113,113,0.08)] text-[var(--red-400)]/60",
                  cell.status === "future" && "text-[var(--text-muted)]",
                  cell.status === "today" && "ring-2 ring-[var(--purple-500)] ring-offset-1 ring-offset-[var(--bg-base)]",
                )}
              >
                {cell.status === "solved" ? "✓" : cell.day}
                {cell.status === "today" && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--purple-500)]" />
                )}
              </button>
            ))}
          </div>
          {selectedDay && (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {selectedDay.date}: <strong>{selectedDay.title}</strong> ({selectedDay.difficulty})
            </p>
          )}
        </motion.div>

        <motion.div {...fadeUp} className="glass-card chart-wrapper p-5">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Difficulty History</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={difficultyData.length ? difficultyData : [{ name: "None", value: 1 }]} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                  {(difficultyData.length ? difficultyData : [{ name: "None", value: 1 }]).map((entry) => (
                    <Cell key={entry.name} fill={DIFFICULTY_COLORS[entry.name] ?? "#64748B"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            {difficultyData.map((d) => (
              <span key={d.name} style={{ color: DIFFICULTY_COLORS[d.name] }}>
                ● {d.name} ({d.value})
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeUp} className="glass-card chart-wrapper p-5">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Avg Solve Time by Month</h2>
        <div className="h-[220px] w-full md:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={solveTimeByMonth}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} unit="m" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
