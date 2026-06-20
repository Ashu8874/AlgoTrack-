"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  XCircle,
} from "lucide-react";
import RevisionPriority from "@/components/ai/RevisionPriority";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/models/Session";

type RevisionRecord = {
  _id: string;
  problemSlug: string;
  problemTitle: string;
  difficulty: Difficulty;
  nextReviewDate: string;
  interval: number;
  repetitions: number;
  history: Array<{ date: string; result: "pass" | "fail" }>;
};

type RevisionResponse = {
  dueToday: RevisionRecord[];
  all: RevisionRecord[];
  total: number;
  mastered: number;
  forgotten: number;
};

function difficultyBadgeClass(difficulty: Difficulty): string {
  if (difficulty === "Easy") return "badge-easy";
  if (difficulty === "Medium") return "badge-medium";
  return "badge-hard";
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function RevisionPage() {
  const [data, setData] = useState<RevisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [reviewTarget, setReviewTarget] = useState<RevisionRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRevisions = useCallback(async () => {
    try {
      const res = await fetch("/api/revision");
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as RevisionResponse;
      setData(json);
    } catch {
      setData({ dueToday: [], all: [], total: 0, mastered: 0, forgotten: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRevisions();
  }, [fetchRevisions]);

  const dueDates = useMemo(() => {
    const map = new Map<string, number>();
    (data?.all ?? []).forEach((r) => {
      const key = new Date(r.nextReviewDate).toISOString().split("T")[0];
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [data?.all]);

  const dueProblems = useMemo(
    () =>
      (data?.all ?? []).map((item) => ({
        title: item.problemTitle,
        slug: item.problemSlug,
        dueInDays: Math.max(
          0,
          Math.ceil((new Date(item.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        ),
      })),
    [data?.all],
  );

  const stackedData = useMemo(() => {
    const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
    return difficulties.map((d) => {
      const items = (data?.all ?? []).filter((r) => r.difficulty === d);
      const pass = items.reduce(
        (sum, r) => sum + r.history.filter((h) => h.result === "pass").length,
        0,
      );
      const fail = items.reduce(
        (sum, r) => sum + r.history.filter((h) => h.result === "fail").length,
        0,
      );
      return { difficulty: d, pass, fail };
    });
  }, [data?.all]);

  const submitReview = async (result: "pass" | "fail") => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: reviewTarget.problemSlug,
          problemTitle: reviewTarget.problemTitle,
          difficulty: reviewTarget.difficulty,
          result,
        }),
      });
      if (res.ok) {
        setReviewTarget(null);
        await fetchRevisions();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold sm:text-3xl">
          <span className="gradient-text">Spaced Repetition</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Review problems at optimal intervals to retain mastery
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { label: "Due Today", value: data?.dueToday.length ?? 0, icon: Clock, color: "text-cyan-400" },
            { label: "Total Cards", value: data?.total ?? 0, icon: BookOpen, color: "text-purple-400" },
            { label: "Mastered", value: data?.mastered ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Needs Work", value: data?.forgotten ?? 0, icon: Brain, color: "text-amber-400" },
          ] as const
        ).map((stat) => (
          <motion.div key={stat.label} {...fadeUp} className="glass-card p-5">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevisionPriority dueProblems={dueProblems} />
        <motion.div {...fadeUp} className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="h-4 w-4" />
              Review Calendar
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm text-[var(--text-secondary)]">
                {calendarMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--text-muted)]">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const key = formatDateKey(year, month, day);
                  const count = dueDates.get(key) ?? 0;
                  const isToday = key === new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex h-9 flex-col items-center justify-center rounded-lg text-xs transition-colors",
                        isToday && "ring-1 ring-purple-500",
                        count > 0 ? "bg-purple-500/20 text-white" : "text-[var(--text-muted)]",
                      )}
                      title={count > 0 ? `${count} review${count > 1 ? "s" : ""} due` : undefined}
                    >
                      <span>{day}</span>
                      {count > 0 && (
                        <span className="text-[9px] font-bold text-[var(--purple-300)]">{count}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>

        <motion.div {...fadeUp} className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Review Results by Difficulty</h3>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData}>
                  <ChartGradients />
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="difficulty" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pass" name="Pass" stackId="a" fill="#34D399" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="fail" name="Fail" stackId="a" fill="#F87171" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div {...fadeUp} className="glass-card overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-sm font-semibold text-white">Due Today</h3>
          <p className="text-xs text-[var(--text-muted)]">
            {(data?.dueToday.length ?? 0) === 0
              ? "All caught up! Great work."
              : `${data?.dueToday.length} problem${(data?.dueToday.length ?? 0) > 1 ? "s" : ""} waiting for review`}
          </p>
        </div>
        <div className="divide-y divide-[var(--border)]/50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : (data?.dueToday.length ?? 0) === 0 ? (
            <p className="p-8 text-center text-[var(--text-muted)]">
              No reviews due today. Solve problems in the session tracker to add cards.
            </p>
          ) : (
            data?.dueToday.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.02]"
              >
                <div>
                  <p className="font-medium text-white">{item.problemTitle}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", difficultyBadgeClass(item.difficulty))}>
                      {item.difficulty}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Interval: {item.interval}d · Reps: {item.repetitions}
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => setReviewTarget(item)}>
                  Review
                </Button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {reviewTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setReviewTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{reviewTarget.problemTitle}</h3>
                  <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold", difficultyBadgeClass(reviewTarget.difficulty))}>
                    {reviewTarget.difficulty}
                  </span>
                </div>
                <button type="button" onClick={() => setReviewTarget(null)} className="text-[var(--text-muted)] hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                Try solving this problem from memory. Use the timer if you need to practice under time pressure.
              </p>

              <Button variant="outline" className="mb-4 w-full" asChild>
                <Link href="/dashboard/session">
                  <Clock className="h-4 w-4" />
                  Open Problem Timer
                </Link>
              </Button>

              <p className="mb-3 text-sm font-medium text-white">How did you do?</p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={submitting}
                  onClick={() => void submitReview("pass")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Passed
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => void submitReview("fail")}
                >
                  <XCircle className="h-4 w-4" />
                  Failed
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
