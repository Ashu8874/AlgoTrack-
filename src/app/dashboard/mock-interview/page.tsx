"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  Building2,
  Clock,
  Lightbulb,
  Maximize2,
  MessageSquare,
  Play,
  Sparkles,
  Trophy,
} from "lucide-react";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

type MockProblem = {
  title: string;
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation: string }>;
  hints: string[];
  difficulty: string;
  topics: string[];
};

type InterviewPhase = "setup" | "interview" | "debrief";

type MockInterviewRecord = {
  _id: string;
  company: string;
  difficulty: string;
  score: number;
  hintsUsed: number;
  durationSeconds: number;
  feedback: string;
  completedAt: string;
  problem: MockProblem;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function difficultyBadgeClass(difficulty: string): string {
  const d = difficulty.toLowerCase();
  if (d === "easy") return "badge-easy";
  if (d === "hard") return "badge-hard";
  return "badge-medium";
}

const COMPANIES = ["Google", "Meta", "Amazon", "Microsoft", "Apple", "Netflix", "Startup"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DURATIONS = [
  { label: "30 min", seconds: 1800 },
  { label: "45 min", seconds: 2700 },
  { label: "60 min", seconds: 3600 },
];

export default function MockInterviewPage() {
  const [phase, setPhase] = useState<InterviewPhase>("setup");
  const [company, setCompany] = useState("Google");
  const [difficulty, setDifficulty] = useState("Medium");
  const [durationSeconds, setDurationSeconds] = useState(2700);
  const [customCompany, setCustomCompany] = useState("");
  const [problem, setProblem] = useState<MockProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [history, setHistory] = useState<MockInterviewRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  const effectiveCompany = customCompany.trim() || company;

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/mock-interview");
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { interviews: MockInterviewRecord[] };
      setHistory(data.interviews ?? []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const remaining = Math.max(0, durationSeconds - elapsed);
  const timeUp = elapsed >= durationSeconds;

  const scoreTrend = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .slice(-20)
      .map((h, i) => ({
        label: `#${i + 1}`,
        score: h.score,
        company: h.company,
      }));
  }, [history]);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/mock-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: effectiveCompany, difficulty }),
      });
      if (!res.ok) throw new Error("Failed to generate problem");
      const data = (await res.json()) as MockProblem;
      setProblem(data);
      setElapsed(0);
      setHintsUsed(0);
      setHintText("");
      setNotes("");
      setFeedback("");
      setScore(0);
      setPhase("interview");
      setTimerRunning(true);
    } catch {
      alert("Failed to generate problem. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestHint = async (type: "nudge" | "approach") => {
    if (!problem) return;
    setHintLoading(true);
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: `${problem.title}: ${problem.description}`,
          type,
        }),
      });
      const data = (await res.json()) as { hint?: string };
      setHintText(data.hint ?? "No hint available.");
      setHintsUsed((h) => h + 1);
    } catch {
      setHintText("Failed to get hint.");
    } finally {
      setHintLoading(false);
    }
  };

  const finishInterview = async () => {
    if (!problem) return;
    setTimerRunning(false);
    setDebriefLoading(true);
    setPhase("debrief");
    try {
      const res = await fetch("/api/ai/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          notes,
          hintsUsed,
          durationSeconds: elapsed,
          difficulty,
          company: effectiveCompany,
        }),
      });
      const data = (await res.json()) as { feedback?: string; score?: number; error?: string };
      setFeedback(data.feedback ?? data.error ?? "No feedback available.");
      setScore(data.score ?? 0);
      await fetchHistory();
    } catch {
      setFeedback("Failed to generate debrief.");
    } finally {
      setDebriefLoading(false);
    }
  };

  const enterFullscreen = () => {
    roomRef.current?.requestFullscreen?.();
  };

  const resetToSetup = () => {
    setPhase("setup");
    setProblem(null);
    setTimerRunning(false);
    setElapsed(0);
  };

  if (phase === "interview" && problem) {
    return (
      <div ref={roomRef} className="flex min-h-screen flex-col bg-[var(--bg-base)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={resetToSetup}>
              <ArrowLeft className="h-4 w-4" />
              Exit
            </Button>
            <span className="text-sm font-medium text-white">{effectiveCompany}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", difficultyBadgeClass(difficulty))}>
              {difficulty}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "font-mono text-lg font-bold",
                timeUp ? "text-red-400" : remaining < 300 ? "text-amber-400" : "text-cyan-400",
              )}
            >
              {formatDuration(remaining)}
            </div>
            <Button variant="ghost" size="icon" onClick={enterFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => void finishInterview()}>
              Finish
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 lg:flex-row lg:p-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {problem.description}
            </p>

            {problem.constraints.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-white">Constraints</h3>
                <ul className="list-inside list-disc text-sm text-[var(--text-secondary)]">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {problem.examples.map((ex, i) => (
              <div key={i} className="glass-card p-4">
                <p className="mb-1 text-xs font-semibold text-[var(--purple-300)]">Example {i + 1}</p>
                <p className="font-mono text-sm text-[var(--text-secondary)]">
                  Input: {ex.input}
                </p>
                <p className="font-mono text-sm text-[var(--text-secondary)]">
                  Output: {ex.output}
                </p>
                {ex.explanation && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{ex.explanation}</p>
                )}
              </div>
            ))}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-white">Your Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your approach, complexity analysis, edge cases…"
                className="h-32 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <aside className="w-full space-y-4 lg:w-80">
            <div className="glass-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Hints ({hintsUsed} used)
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={hintLoading}
                  onClick={() => void requestHint("nudge")}
                >
                  Nudge
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={hintLoading}
                  onClick={() => void requestHint("approach")}
                >
                  Approach
                </Button>
              </div>
              {hintText && (
                <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm text-[var(--text-secondary)]">
                  {hintText}
                </p>
              )}
            </div>

            {problem.topics.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="mb-2 text-sm font-semibold text-white">Topics</h3>
                <div className="flex flex-wrap gap-1.5">
                  {problem.topics.map((t) => (
                    <span key={t} className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs text-[var(--purple-300)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {timeUp && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                Time is up! Wrap up your solution and click Finish.
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  if (phase === "debrief") {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <motion.div {...fadeUp}>
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">Interview Debrief</span>
          </h1>
        </motion.div>

        {debriefLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <motion.div {...fadeUp} className="glass-card p-6 text-center">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-400" />
              <p className="text-5xl font-bold text-white">{score}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Interview Score</p>
              <div className="mt-4 flex justify-center gap-6 text-sm text-[var(--text-secondary)]">
                <span>Hints: {hintsUsed}</span>
                <span>Time: {formatDuration(elapsed)}</span>
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="glass-card p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquare className="h-4 w-4" />
                Coach Feedback
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {feedback}
              </p>
            </motion.div>

            <Button onClick={resetToSetup}>
              <Play className="h-4 w-4" />
              New Interview
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold sm:text-3xl">
          <span className="gradient-text">Mock Interview</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Practice under real interview conditions with AI-generated problems
        </p>
      </motion.div>

      <motion.div {...fadeUp} className="glass-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Interview Setup
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Building2 className="h-3.5 w-3.5" />
              Company
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMPANIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCompany(c); setCustomCompany(""); }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    company === c && !customCompany
                      ? "bg-purple-500/20 text-white"
                      : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <Input
              value={customCompany}
              onChange={(e) => setCustomCompany(e.target.value)}
              placeholder="Or type custom company…"
              className="mt-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
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

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Clock className="h-3.5 w-3.5" />
              Duration
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.seconds}
                  type="button"
                  onClick={() => setDurationSeconds(d.seconds)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    durationSeconds === d.seconds
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-white/5 text-[var(--text-muted)]",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button className="mt-6" size="lg" onClick={() => void startInterview()} disabled={loading}>
          <Play className="h-4 w-4" />
          {loading ? "Generating Problem…" : "Start Interview"}
        </Button>
      </motion.div>

      <motion.div {...fadeUp} className="glass-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Score Trend</h3>
        {historyLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : scoreTrend.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            Complete your first mock interview to see score trends
          </p>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend}>
                <ChartGradients />
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="Score" stroke="#A78BFA" strokeWidth={2} dot={{ r: 4, fill: "#7C3AED" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      <motion.div {...fadeUp} className="glass-card overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-sm font-semibold text-white">Interview History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Difficulty</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Hints</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No interviews yet
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h._id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{h.company}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", difficultyBadgeClass(h.difficulty))}>
                        {h.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[var(--purple-300)]">{h.score}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{h.hintsUsed}</td>
                    <td className="px-4 py-3 font-mono text-[var(--text-muted)]">
                      {formatDuration(h.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(h.completedAt).toLocaleDateString()}
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
