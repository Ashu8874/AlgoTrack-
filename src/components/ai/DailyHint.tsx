"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyHint({ topics, recentProblems }: { topics: string[]; recentProblems: string[]; }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHint = async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/daily-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, recentProblems, refresh }),
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
    void fetchHint();
  }, [topics, recentProblems]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-5">
        <Skeleton className="h-10 w-40 mb-4" />
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
          <h3 className="mt-3 text-lg font-semibold text-white">Daily Hint</h3>
        </div>
        <button type="button" onClick={() => void fetchHint(true)} className="text-[var(--text-muted)] transition hover:text-white">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-5 rounded-3xl bg-white/5 p-4 text-sm text-[var(--text-secondary)]">
        <p className="font-semibold text-white">Your focus for today</p>
        <p className="mt-3">{data.hintText}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
        <span className="rounded-full bg-slate-700/60 px-3 py-1">Topic: {data.topic}</span>
        <span className="rounded-full bg-slate-700/60 px-3 py-1">Approach: {data.approach}</span>
      </div>
    </div>
  );
}
