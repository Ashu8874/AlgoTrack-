"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlannerNudge({ currentPlan, todayCompleted, streak }: { currentPlan: any[]; todayCompleted: number; streak: number; }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNudge = async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/planner-nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPlan, todayCompleted, streak, refresh }),
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
  };

  useEffect(() => {
    void fetchNudge();
  }, [currentPlan, todayCompleted, streak]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-5">
        <Skeleton className="h-10 w-44 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--text-muted)]">AI unavailable</p>;
  }

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">✨ AI</span>
          <h3 className="mt-3 text-lg font-semibold text-white">Planner Nudge</h3>
        </div>
        <button type="button" onClick={() => void fetchNudge(true)} className="text-[var(--text-muted)] transition hover:text-white">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-5 rounded-3xl bg-white/5 p-4 text-sm text-[var(--text-secondary)]">
        <p className="font-semibold text-white">Daily push</p>
        <p className="mt-3">{data.nudgeText}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Array.isArray(data.dailyGoals) ? data.dailyGoals.map((goal: string, index: number) => (
          <div key={index} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-[var(--text-secondary)]">
            {goal}
          </div>
        )) : null}
      </div>

      <p className="mt-4 text-sm italic text-purple-300">{data.reasoning}</p>
    </div>
  );
}
