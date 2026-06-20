"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import {
  Calendar,
  Check,
  ChevronDown,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PlannerNudge from "@/components/ai/PlannerNudge";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface DailyTask {
  topic: string;
  problems: number;
  type: string;
}

interface WeeklyPlan {
  week: number;
  theme: string;
  goals: string[];
  dailyTasks: Record<string, DailyTask>;
  weeklyMilestone: string;
  problemsTarget: number;
}

interface PlanData {
  planTitle: string;
  totalWeeks: number;
  weeksUntilInterview: number;
  dailyHours: number;
  weeklyPlans: WeeklyPlan[];
  keyTechniques: string[];
  warningAreas: string[];
}

interface StudyPlanDoc {
  _id: string;
  targetCompany: string;
  interviewDate: string;
  dailyHours: number;
  weakTopics: string[];
  goal: string;
  plan: PlanData;
  completedDays: Array<{ date: string; week: number; day: string }>;
}

const COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix", "Uber", "Airbnb",
  "Stripe", "Coinbase", "LinkedIn", "Twitter", "Salesforce", "Adobe", "Oracle",
  "Bloomberg", "Goldman Sachs", "JPMorgan", "Palantir", "Databricks", "Snowflake",
  "Shopify", "Spotify", "Snap", "Pinterest", "Reddit", "DoorDash", "Instacart",
  "TikTok", "ByteDance", "Nvidia", "Intel", "AMD", "Qualcomm", "Tesla",
  "Waymo", "Cruise", "Roblox", "Epic Games", "Riot Games", "Two Sigma",
  "Citadel", "Jane Street", "DE Shaw", "HRT", "Capital One", "Visa",
  "Mastercard", "PayPal", "Square", "Block",
];

const TOPICS = [
  "Arrays", "Hash Maps", "Two Pointers", "Sliding Window", "Binary Search",
  "Trees", "Graphs", "Dynamic Programming", "Backtracking", "Greedy",
  "Heap", "Trie", "Union Find", "Bit Manipulation", "Math",
];

const GOALS = ["Get an offer", "Improve rating", "Build consistency"] as const;
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_COLORS: Record<string, string> = {
  learn: "#22D3EE",
  practice: "#34D399",
  review: "#FBBF24",
  challenge: "#F87171",
  mixed: "#A78BFA",
  mock: "#F472B6",
  rest: "#64748B",
};

function getTodayKey() {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

export default function PlannerPage() {
  const [studyPlan, setStudyPlan] = useState<StudyPlanDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]));
  const [error, setError] = useState<string | null>(null);

  const [targetCompany, setTargetCompany] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>(GOALS[0]);

  const fetchPlan = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/planner");
      if (!res.ok) throw new Error("Failed to load plan");
      const data = (await res.json()) as { plan: StudyPlanDoc | null };
      setStudyPlan(data.plan);
      if (data.plan) {
        setOpenWeeks(new Set([1]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);

  const plan = studyPlan?.plan;
  const todayKey = getTodayKey();

  const todayCompleted = useMemo(
    () =>
      studyPlan?.completedDays.filter(
        (d) => d.date === new Date().toISOString().split("T")[0],
      ).length ?? 0,
    [studyPlan?.completedDays],
  );

  const streak = useMemo(() => {
    if (!studyPlan?.completedDays.length) return 0;
    const solved = new Set(studyPlan.completedDays.map((d) => d.date));
    let count = 0;
    const day = new Date();
    while (true) {
      const key = day.toISOString().split("T")[0];
      if (!solved.has(key)) break;
      count += 1;
      day.setDate(day.getDate() - 1);
    }
    return count;
  }, [studyPlan?.completedDays]);

  const daysUntilInterview = useMemo(() => {
    if (!studyPlan?.interviewDate) return 0;
    const diff = new Date(studyPlan.interviewDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [studyPlan?.interviewDate]);

  const completionPct = useMemo(() => {
    if (!plan || !studyPlan) return 0;
    const totalDays = plan.totalWeeks * 7;
    return Math.round((studyPlan.completedDays.length / totalDays) * 100);
  }, [plan, studyPlan]);

  const status = completionPct >= 50 ? "On track" : completionPct >= 25 ? "Behind" : "Getting started";
  const statusColor =
    status === "On track" ? "text-[var(--green-400)]" : status === "Behind" ? "text-[var(--amber-400)]" : "text-[var(--cyan-400)]";

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!targetCompany || !interviewDate) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCompany, interviewDate, dailyHours, weakTopics, goal }),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const data = (await res.json()) as { plan: StudyPlanDoc };
      setStudyPlan(data.plan);
      setOpenWeeks(new Set([1]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function markComplete(week: number, day: string) {
    try {
      const res = await fetch("/api/planner/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, day, date: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to mark complete");
      const data = (await res.json()) as { plan: StudyPlanDoc };
      setStudyPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleReschedule() {
    if (!plan?.weeklyPlans?.[0]) return;
    setRescheduling(true);
    const currentWeek = plan.weeklyPlans[0];
    const todayIdx = DAYS.indexOf(todayKey);
    const remainingDays = DAYS.slice(todayIdx);
    const missedTasks = remainingDays
      .filter((d) => !studyPlan?.completedDays.some((c) => c.week === 1 && c.day === d))
      .map((d) => ({ day: d, ...currentWeek.dailyTasks[d] }));

    try {
      const res = await fetch("/api/ai/planner-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remainingDays: remainingDays.join(", "),
          missedTasks,
          currentWeek,
        }),
      });
      if (!res.ok) throw new Error("Reschedule failed");
      await fetchPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setRescheduling(false);
    }
  }

  function isDayComplete(week: number, day: string) {
    return studyPlan?.completedDays.some((c) => c.week === week && c.day === day) ?? false;
  }

  function weekProgress(weekly: WeeklyPlan) {
    const done = studyPlan?.completedDays.filter((c) => c.week === weekly.week).length ?? 0;
    return { done, target: weekly.problemsTarget };
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!studyPlan || !plan) {
    return (
      <motion.div className="mx-auto max-w-2xl space-y-6 p-6 lg:p-8" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div {...fadeUp}>
          <h1 className="text-3xl font-bold gradient-text">Study Planner</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Get a personalized multi-week plan powered by AI</p>
        </motion.div>

        <motion.form {...fadeUp} onSubmit={handleGenerate} className="glass-card space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">Target Company</label>
            <Input
              list="companies"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g. Google"
              required
              className="border-[var(--border)] bg-[var(--bg-surface)]"
            />
            <datalist id="companies">
              {COMPANIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">Interview Date</label>
            <Input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              required
              className="border-[var(--border)] bg-[var(--bg-surface)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">Hours per day</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setDailyHours(h)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    dailyHours === h
                      ? "bg-[var(--purple-500)] text-white"
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)]",
                  )}
                >
                  {h === 4 ? "4h+" : `${h}h`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">Weakest Topics</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setWeakTopics((prev) =>
                      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                    )
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    weakTopics.includes(t)
                      ? "bg-[var(--purple-500)]/30 text-[var(--purple-300)] border border-[var(--purple-500)]"
                      : "border border-[var(--border)] text-[var(--text-muted)]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">Goal</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm transition-colors",
                    goal === g
                      ? "bg-[var(--cyan-400)]/20 text-[var(--cyan-400)] border border-[var(--cyan-400)]/40"
                      : "border border-[var(--border)] text-[var(--text-secondary)]",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[var(--red-400)]">{error}</p>}

          <Button type="submit" disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating your plan…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Study Plan
              </>
            )}
          </Button>
        </motion.form>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6 p-6 lg:p-8" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{plan.planTitle}</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {studyPlan.targetCompany} · {studyPlan.dailyHours}h/day · {studyPlan.goal}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleReschedule()} disabled={rescheduling}>
          <RefreshCw className={cn("mr-2 h-4 w-4", rescheduling && "animate-spin")} />
          Reschedule
        </Button>
      </motion.div>

      <motion.div {...fadeUp} className="flex flex-wrap items-center gap-4">
        <span className="rounded-full bg-[var(--purple-500)]/20 px-4 py-1.5 text-sm font-medium text-[var(--purple-300)]">
          <Calendar className="mr-1 inline h-4 w-4" />
          {daysUntilInterview} days until interview
        </span>
        <span className={cn("rounded-full px-4 py-1.5 text-sm font-medium", statusColor, "bg-[var(--bg-card)]")}>
          {status}
        </span>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: completionPct },
                    { value: 100 - completionPct },
                  ]}
                  innerRadius={14}
                  outerRadius={22}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#7C3AED" />
                  <Cell fill="rgba(255,255,255,0.06)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{completionPct}%</p>
            <p className="text-xs text-[var(--text-muted)]">complete</p>
          </div>
        </div>
      </motion.div>

      <PlannerNudge currentPlan={plan?.weeklyPlans ?? []} todayCompleted={todayCompleted} streak={streak} />

      <PlannerNudge currentPlan={plan?.weeklyPlans ?? []} todayCompleted={todayCompleted} streak={streak} />

      {error && <p className="text-sm text-[var(--red-400)]">{error}</p>}

      <div className="space-y-4">
        {plan.weeklyPlans.map((weekly) => {
          const isOpen = openWeeks.has(weekly.week);
          const progress = weekProgress(weekly);
          const pct = weekly.problemsTarget > 0 ? Math.round((progress.done / 7) * 100) : 0;

          return (
            <motion.div key={weekly.week} {...fadeUp} className="glass-card overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setOpenWeeks((prev) => {
                    const next = new Set(prev);
                    if (next.has(weekly.week)) next.delete(weekly.week);
                    else next.add(weekly.week);
                    return next;
                  })
                }
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Week {weekly.week}</p>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{weekly.theme}</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {weekly.goals.slice(0, 3).map((g) => (
                      <span key={g} className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 text-[var(--text-muted)] transition-transform", isOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-[var(--border)]"
                  >
                    <div className="grid gap-2 p-4 sm:grid-cols-7">
                      {DAYS.map((day, i) => {
                        const task = weekly.dailyTasks[day];
                        const complete = isDayComplete(weekly.week, day);
                        const isToday = weekly.week === 1 && day === todayKey;

                        return (
                          <div
                            key={day}
                            className={cn(
                              "rounded-xl border p-3 transition-colors",
                              complete && "border-[var(--green-400)]/30 bg-[rgba(52,211,153,0.08)]",
                              isToday && !complete && "animate-pulse border-[var(--purple-500)]",
                              !complete && !isToday && "border-[var(--border)]",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-[var(--text-muted)]">{DAY_LABELS[i]}</span>
                              {complete && <Check className="h-3.5 w-3.5 text-[var(--green-400)]" />}
                            </div>
                            {task && (
                              <>
                                <p className="mt-1 text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                                  {task.topic}
                                </p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">{task.problems} problems</p>
                                <span
                                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{
                                    background: `${TYPE_COLORS[task.type] ?? "#64748B"}20`,
                                    color: TYPE_COLORS[task.type] ?? "#64748B",
                                  }}
                                >
                                  {task.type}
                                </span>
                              </>
                            )}
                            {isToday && !complete && (
                              <Button
                                size="sm"
                                className="mt-2 w-full text-xs"
                                onClick={() => void markComplete(weekly.week, day)}
                              >
                                Mark done
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-[var(--border)] px-5 py-4">
                      <p className="text-sm text-[var(--text-secondary)]">
                        <Target className="mr-1 inline h-4 w-4 text-[var(--amber-400)]" />
                        {weekly.weeklyMilestone}
                      </p>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                          <span>Week progress</span>
                          <span>{progress.done}/7 days · target {weekly.problemsTarget} problems</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--purple-500)] to-[var(--cyan-400)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <motion.div {...fadeUp} className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-3 font-semibold text-[var(--green-400)]">Key Techniques</h3>
          <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
            {plan.keyTechniques.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-3 font-semibold text-[var(--amber-400)]">Warning Areas</h3>
          <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
            {plan.warningAreas.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
