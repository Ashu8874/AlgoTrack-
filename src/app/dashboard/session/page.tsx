"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Send,
  Timer,
  XCircle,
} from "lucide-react";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/models/Session";

type SessionRecord = {
  _id: string;
  problem: string;
  problemSlug: string;
  difficulty: Difficulty;
  durationSeconds: number;
  solved: boolean;
  hintsUsed: number;
  notes: string;
  startedAt: string;
  completedAt: string;
};

type TimerState = "idle" | "running" | "paused";
type SortKey = "completedAt" | "problem" | "difficulty" | "durationSeconds" | "solved";
type SortDir = "asc" | "desc";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const TIMER_RADIUS = 88;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;
const TIME_BUCKETS = [
  { label: "< 15m", min: 0, max: 900 },
  { label: "15-30m", min: 900, max: 1800 },
  { label: "30-45m", min: 1800, max: 2700 },
  { label: "45-60m", min: 2700, max: 3600 },
  { label: "> 60m", min: 3600, max: Infinity },
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function difficultyBadgeClass(difficulty: Difficulty): string {
  if (difficulty === "Easy") return "badge-easy";
  if (difficulty === "Medium") return "badge-medium";
  return "badge-hard";
}

function CircularTimer({
  elapsed,
  targetSeconds,
  state,
}: {
  elapsed: number;
  targetSeconds: number;
  state: TimerState;
}) {
  const progress = Math.min(elapsed / targetSeconds, 1);
  const dashOffset = TIMER_CIRCUMFERENCE * (1 - progress);
  const color =
    state === "running" ? "#22D3EE" : state === "paused" ? "#FBBF24" : "#7C3AED";

  return (
    <div className="relative mx-auto h-52 w-52">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={TIMER_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <circle
          cx="100"
          cy="100"
          r={TIMER_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={TIMER_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Timer className="mb-1 h-5 w-5 text-[var(--text-muted)]" />
        <span className="font-mono text-3xl font-bold text-white">
          {formatDuration(elapsed)}
        </span>
        <span className="mt-1 text-xs text-[var(--text-muted)]">
          {state === "idle" ? "Ready" : state === "running" ? "In progress" : "Paused"}
        </span>
      </div>
    </div>
  );
}

function SessionHeatmap({ sessions }: { sessions: SessionRecord[] }) {
  const grid = useMemo(() => {
    const counts = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    sessions.forEach((s) => {
      const d = new Date(s.completedAt);
      counts[d.getDay()][d.getHours()] += 1;
    });
    const max = Math.max(1, ...counts.flat());
    return { counts, max };
  }, [sessions]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="mb-2 flex">
          <div className="w-10" />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="flex-1 text-center text-[10px] text-[var(--text-muted)]"
            >
              {h % 6 === 0 ? `${h}h` : ""}
            </div>
          ))}
        </div>
        {grid.counts.map((row, day) => (
          <div key={DAYS[day]} className="mb-0.5 flex items-center gap-1">
            <span className="w-9 text-xs text-[var(--text-muted)]">{DAYS[day]}</span>
            {row.map((count, hour) => {
              const intensity = count / grid.max;
              return (
                <div
                  key={hour}
                  title={`${DAYS[day]} ${hour}:00 — ${count} session${count !== 1 ? "s" : ""}`}
                  className="h-4 flex-1 rounded-sm transition-transform hover:scale-110"
                  style={{
                    background:
                      count === 0
                        ? "rgba(255,255,255,0.04)"
                        : `rgba(124,58,237,${0.15 + intensity * 0.85})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SessionPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [showSolvedPrompt, setShowSolvedPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("completedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetSeconds = difficulty === "Easy" ? 1800 : difficulty === "Medium" ? 2700 : 3600;

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/session");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as { sessions: SessionRecord[] };
      setSessions(data.sessions ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  const handleStart = () => {
    if (!problem.trim()) return;
    if (timerState === "idle") {
      setStartedAt(new Date());
      setElapsed(0);
    }
    setTimerState("running");
  };

  const handlePause = () => setTimerState("paused");

  const handleReset = () => {
    setTimerState("idle");
    setElapsed(0);
    setStartedAt(null);
    setShowSolvedPrompt(false);
  };

  const handleSubmit = () => {
    if (!problem.trim() || elapsed === 0) return;
    setTimerState("paused");
    setShowSolvedPrompt(true);
  };

  const saveSession = async (solved: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.trim(),
          problemSlug: problem.trim().toLowerCase().replace(/\s+/g, "-"),
          difficulty,
          durationSeconds: elapsed,
          solved,
          startedAt: startedAt?.toISOString() ?? new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        await fetchSessions();
        setProblem("");
        handleReset();
      }
    } finally {
      setSubmitting(false);
      setShowSolvedPrompt(false);
    }
  };

  const sortedSessions = useMemo(() => {
    const copy = [...sessions];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "completedAt") {
        cmp = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      } else if (sortKey === "durationSeconds") {
        cmp = a.durationSeconds - b.durationSeconds;
      } else if (sortKey === "solved") {
        cmp = Number(a.solved) - Number(b.solved);
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [sessions, sortKey, sortDir]);

  const avgByDifficulty = useMemo(() => {
    const result: Record<Difficulty, { avg: number; count: number }> = {
      Easy: { avg: 0, count: 0 },
      Medium: { avg: 0, count: 0 },
      Hard: { avg: 0, count: 0 },
    };
    DIFFICULTIES.forEach((d) => {
      const filtered = sessions.filter((s) => s.difficulty === d);
      const total = filtered.reduce((sum, s) => sum + s.durationSeconds, 0);
      result[d] = {
        count: filtered.length,
        avg: filtered.length ? Math.round(total / filtered.length) : 0,
      };
    });
    return result;
  }, [sessions]);

  const trendData = useMemo(() => {
    const recent = [...sessions]
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .slice(-30);
    return recent.map((s, i) => ({
      label: `#${i + 1}`,
      minutes: Math.round(s.durationSeconds / 60),
      solved: s.solved ? 1 : 0,
    }));
  }, [sessions]);

  const distributionData = useMemo(() => {
    return TIME_BUCKETS.map((bucket) => ({
      label: bucket.label,
      count: sessions.filter(
        (s) => s.durationSeconds >= bucket.min && s.durationSeconds < bucket.max,
      ).length,
    }));
  }, [sessions]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? (
      <ArrowUp className="inline h-3 w-3" />
    ) : (
      <ArrowDown className="inline h-3 w-3" />
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold sm:text-3xl">
          <span className="gradient-text">Problem Timer</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Track solve times, analyze patterns, and build consistency
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div {...fadeUp} className="glass-card p-6 lg:col-span-1">
          <CircularTimer elapsed={elapsed} targetSeconds={targetSeconds} state={timerState} />

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Problem Name
              </label>
              <Input
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. Two Sum"
                disabled={timerState === "running"}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Difficulty
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    disabled={timerState === "running"}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      difficulty === d ? difficultyBadgeClass(d) : "bg-white/5 text-[var(--text-muted)]",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {timerState !== "running" ? (
                <Button onClick={handleStart} disabled={!problem.trim()} className="flex-1">
                  <Play className="h-4 w-4" />
                  {timerState === "paused" ? "Resume" : "Start"}
                </Button>
              ) : (
                <Button variant="outline" onClick={handlePause} className="flex-1">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={elapsed === 0 || !problem.trim()}
              >
                <Send className="h-4 w-4" />
                Submit
              </Button>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showSolvedPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
              >
                <p className="mb-3 text-sm font-medium text-white">Did you solve it?</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => void saveSession(true)}
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void saveSession(false)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4" />
                    No
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
          {DIFFICULTIES.map((d) => (
            <motion.div key={d} {...fadeUp} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", difficultyBadgeClass(d))}>
                  {d}
                </span>
                <Clock className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-white">
                {avgByDifficulty[d].count > 0
                  ? formatDuration(avgByDifficulty[d].avg)
                  : "--:--"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                avg time · {avgByDifficulty[d].count} sessions
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div {...fadeUp} className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">30-Session Trend</h3>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <ChartGradients />
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="minutes" name="Minutes" stroke="#A78BFA" strokeWidth={2} dot={{ r: 3, fill: "#7C3AED" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div {...fadeUp} className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Time Distribution</h3>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <ChartGradients />
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Sessions" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div {...fadeUp} className="glass-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Practice Heatmap (24×7)</h3>
        {loading ? <Skeleton className="h-40 w-full" /> : <SessionHeatmap sessions={sessions} />}
      </motion.div>

      <motion.div {...fadeUp} className="glass-card overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-sm font-semibold text-white">Session History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                {(
                  [
                    ["problem", "Problem"],
                    ["difficulty", "Difficulty"],
                    ["durationSeconds", "Time"],
                    ["solved", "Solved"],
                    ["completedAt", "Date"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="cursor-pointer px-4 py-3 font-medium hover:text-white"
                    onClick={() => toggleSort(key)}
                  >
                    {label} <SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : sortedSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No sessions yet. Start your first timer above!
                  </td>
                </tr>
              ) : (
                sortedSessions.map((s) => (
                  <tr key={s._id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{s.problem}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", difficultyBadgeClass(s.difficulty))}>
                        {s.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                      {formatDuration(s.durationSeconds)}
                    </td>
                    <td className="px-4 py-3">
                      {s.solved ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(s.completedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
