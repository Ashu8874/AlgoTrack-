"use client";

import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChartNarrator({ chartType, chartData }: { chartType: string; chartData: unknown }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalysis = async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/chart-narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartType, chartData }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "AI unavailable");
      setAnalysis(json.analysis);
    } catch {
      setError("AI unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open && !analysis && !loading) {
      await loadAnalysis();
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">✨ AI</span>
          <span>via Groq</span>
        </div>
        <button type="button" onClick={() => void loadAnalysis(true)} className="text-[var(--text-muted)] transition hover:text-white">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      <button type="button" onClick={toggleOpen} className="mt-3 flex w-full items-center justify-between text-sm font-medium text-white">
        <span>🤖 AI Analysis</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
      </button>
      {open && (
        <div className="mt-3 rounded-2xl border-l-4 border-purple-500/70 bg-white/5 p-4 text-sm text-[var(--text-secondary)]">
          {loading ? <Skeleton className="h-16 w-full" /> : error ? <p>{error}</p> : <p>{analysis}</p>}
        </div>
      )}
    </div>
  );
}
