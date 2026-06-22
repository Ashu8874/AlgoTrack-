"use client";

import { useCallback, useEffect, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SessionDebriefData = {
  score?: number;
  verdict?: string;
  whatWentWell?: string;
  whatToImprove?: string;
  nextProblem?: { title?: string; slug?: string; reason?: string };
  motivationalLine?: string;
};

export default function SessionDebrief({ problem, difficulty, durationMinutes, solved, hintsUsed, notes, onClose }: { problem: string; difficulty: string; durationMinutes: number; solved: boolean; hintsUsed: number; notes: string; onClose: () => void; }) {
  const [data, setData] = useState<SessionDebriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDebrief = useCallback(async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/session-debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, difficulty, durationMinutes, solved, hintsUsed, notes, refresh }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "AI unavailable");
      setData(json);
    } catch {
      setError("AI unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [problem, difficulty, durationMinutes, solved, hintsUsed, notes]);

  useEffect(() => {
    void fetchDebrief();
  }, [fetchDebrief]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-[var(--bg-surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">✨ AI</span>
            <h2 className="mt-3 text-2xl font-semibold text-white">Session Debrief</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void fetchDebrief(true)} className="text-[var(--text-muted)] transition hover:text-white">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={onClose} className="text-[var(--text-muted)] transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <p className="mt-6 text-sm text-[var(--text-muted)]">{error}</p>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl bg-white/5 p-5">
              <div>
                <p className="text-5xl font-bold text-white">{data?.score}</p>
                <p className="text-sm text-[var(--text-muted)]">Score</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">{data?.verdict}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">✅ What went well</p>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{data?.whatWentWell}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">⚠️ What to improve</p>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{data?.whatToImprove}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-purple-500/10 p-5">
              <p className="text-sm font-semibold text-white">Next problem</p>
              <a href={`https://leetcode.com/problems/${data?.nextProblem?.slug}/`} target="_blank" rel="noreferrer" className="mt-3 block text-lg font-semibold text-white hover:text-purple-300">
                {data?.nextProblem?.title}
              </a>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{data?.nextProblem?.reason}</p>
              <Button asChild className="mt-4">
                <a href={`https://leetcode.com/problems/${data?.nextProblem?.slug}/`} target="_blank" rel="noreferrer">
                  Solve Now →
                </a>
              </Button>
            </div>

            <p className="text-sm italic text-purple-300">{data?.motivationalLine}</p>
          </div>
        )}
      </div>
    </div>
  );
}
