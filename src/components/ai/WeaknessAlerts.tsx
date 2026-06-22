"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const severityStyles: Record<string, { border: string; badge: string }> = {
  critical: { border: "border-red-500", badge: "bg-red-500/10 text-red-300" },
  moderate: { border: "border-amber-500", badge: "bg-amber-500/10 text-amber-300" },
  minor: { border: "border-sky-500", badge: "bg-sky-500/10 text-sky-300" },
};

export default function WeaknessAlerts({ userId }: { userId: string }) {
  const [data, setData] = useState<Array<{ topic: string; severity: string; reason: string; fix: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/weakness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh, userId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "AI unavailable");
      setData(json.gaps ?? []);
    } catch {
      setError("AI unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="glass-card h-40 p-4">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--text-muted)]">AI unavailable</p>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {data?.map((item) => {
        const styles = severityStyles[item.severity] ?? severityStyles.minor;
        return (
          <div key={item.topic} className={`glass-card rounded-3xl border-l-4 p-5 ${styles.border}`}>
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">
                ✨ AI
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">via Groq</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.topic}</h3>
                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles.badge}`}>{item.severity}</span>
              </div>
              <button
                type="button"
                onClick={() => void fetchData(true)}
                className="text-[var(--text-muted)] transition hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">{item.reason}</p>
            <p className="mt-4 text-sm text-emerald-300">→ {item.fix}</p>
            <a
              href={`https://leetcode.com/tag/${item.topic.toLowerCase().replace(/\s+/g, "-")}/`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Practice Now
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        );
      })}
    </div>
  );
}
