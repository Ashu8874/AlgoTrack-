"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const trendStyles: Record<string, string> = {
  improving: "bg-emerald-500/10 text-emerald-200",
  declining: "bg-red-500/10 text-red-200",
  volatile: "bg-amber-500/10 text-amber-200",
  stable: "bg-sky-500/10 text-sky-200",
};

type ContestHistoryEntry = {
  attended?: boolean | null;
};

type ContestAnalysisData = {
  trend?: string;
  trendReason?: string;
  tips?: string[];
  nextContestGoal?: string;
  ratingPrediction?: string;
};

export default function ContestAnalysis({ contestHistory }: { contestHistory: ContestHistoryEntry[] }) {
  const [data, setData] = useState<ContestAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalysis = useCallback(async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/contest-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestHistory, refresh }),
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
  }, [contestHistory]);

  useEffect(() => {
    void fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-5">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--text-muted)]">AI unavailable</p>;
  }

  const trend = data?.trend ?? "stable";

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">✨ AI</span>
          <h3 className="mt-3 text-lg font-semibold text-white">🤖 AI Contest Analysis</h3>
        </div>
        <button type="button" onClick={() => void fetchAnalysis(true)} className="text-[var(--text-muted)] transition hover:text-white">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className={`mt-5 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${trendStyles[trend] ?? trendStyles.stable}`}>{trend}</div>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">{data?.trendReason}</p>

      <div className="mt-5 space-y-3">
        {(Array.isArray(data?.tips) ? data.tips : []).map((tip: string, index: number) => (
          <div key={index} className="rounded-3xl bg-white/5 p-4 text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-white">{index + 1}.</span> {tip}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Next contest goal</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{data?.nextContestGoal}</p>
      </div>

      <p className="mt-4 italic text-purple-300">{data?.ratingPrediction}</p>
    </div>
  );
}
