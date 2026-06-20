"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RevisionPriority({ dueProblems }: { dueProblems: { title: string; slug: string; dueInDays: number; }[]; }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPriority = async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/revision-priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueProblems, refresh }),
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
    void fetchPriority();
  }, [dueProblems]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-5">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
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
          <h3 className="mt-3 text-lg font-semibold text-white">Revision Priority</h3>
        </div>
        <button type="button" onClick={() => void fetchPriority(true)} className="text-[var(--text-muted)] transition hover:text-white">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {(Array.isArray(data.priorityList) ? data.priorityList : []).map((item: any, index: number) => (
          <div key={item.slug ?? index} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">{index + 1}. {item.title}</span>
              <span className="rounded-full bg-slate-700/70 px-2 py-1 text-[11px] uppercase tracking-[0.15em] text-slate-200">Due in {item.dueInDays}d</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
