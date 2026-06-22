"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function levelBadge(level: string) {
  if (level === "Beginner") return "bg-blue-500/10 text-blue-200";
  if (level === "Intermediate") return "bg-amber-500/10 text-amber-200";
  return "bg-emerald-500/10 text-emerald-200";
}

type TopicCoachData = {
  level?: string;
  levelReason?: string;
  keyPattern?: string;
  patternTip?: string;
  nextProblems?: Array<{ title: string; slug: string; why: string }>;
};

export default function TopicCoach({ topicName, solved, acceptanceRate }: { topicName: string; solved: number; acceptanceRate: number }) {
  const [data, setData] = useState<TopicCoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCoach = useCallback(async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/topic-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicName, solved, acceptanceRate, refresh }),
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
  }, [topicName, solved, acceptanceRate]);

  useEffect(() => {
    void fetchCoach();
  }, [fetchCoach]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-5">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full mt-4" />
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
          <p className="mt-2 text-lg font-semibold text-white">🎯 AI Coach for {topicName}</p>
        </div>
        <button type="button" onClick={() => void fetchCoach(true)} className="text-[var(--text-muted)] transition hover:text-white">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${levelBadge(data?.level ?? "Beginner")}`}>
          {data?.level}
        </span>
        <p className="text-sm text-[var(--text-secondary)]">{data?.levelReason}</p>
      </div>

      <div className="mt-4 rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Key Pattern</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{data?.keyPattern}</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{data?.patternTip}</p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-white">Next 3 Problems</p>
        <div className="mt-3 space-y-3">
          {Array.isArray(data?.nextProblems) ? data.nextProblems.map((problem, index: number) => (
            <div key={problem.slug ?? index} className="rounded-3xl border border-white/10 p-4">
              <a href={`https://leetcode.com/problems/${problem.slug}/`} target="_blank" rel="noreferrer" className="font-medium text-white hover:text-purple-300">
                {problem.title}
              </a>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{problem.why}</p>
            </div>
          )) : null}
        </div>
      </div>
    </div>
  );
}
