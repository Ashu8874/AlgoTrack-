"use client";

import { useEffect, useMemo, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const todayKey = new Date().toISOString().slice(0, 10);
const storageKey = `briefing-dismissed-${todayKey}`;

export default function DailyBriefing() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedToday = localStorage.getItem(storageKey) === "1";
    setDismissed(dismissedToday);
  }, []);

  useEffect(() => {
    if (dismissed) {
      setLoading(false);
      return;
    }

    const fetchBriefing = async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ai/briefing${refresh ? "?refresh=1" : ""}`);
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "AI unavailable");
        }
        setBriefing(data.briefing);
      } catch {
        setError("AI unavailable");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    void fetchBriefing();
  }, [dismissed]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "1");
    }
    setDismissed(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetch(`/api/ai/briefing?refresh=1`);
    const data = await res.json();
    if (res.ok && !data.error) {
      setBriefing(data.briefing);
      setError(null);
    } else {
      setError("AI unavailable");
    }
    setRefreshing(false);
  };

  const animatedText = useMemo(() => briefing?.split("").map((char, index) => (
    <span key={`${char}-${index}`} style={{ animationDelay: `${index * 0.018}s` }} className="inline-block opacity-0 animate-typewriter">
      {char}
    </span>
  )), [briefing]);

  if (dismissed) return null;

  return (
    <div className="glass-card relative overflow-hidden rounded-3xl border-l-4 border-purple-600 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">
            ✨ AI
          </span>
        </div>
        <div className="text-xs text-[var(--text-muted)]">via Groq</div>
      </div>
      <div className="mt-4 flex items-start gap-3">
        <div className="mt-1 text-3xl">🤖</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">AI Daily Briefing</p>
              <p className="text-xs text-[var(--text-muted)]">A focused morning plan for your progress</p>
            </div>
            <button type="button" onClick={handleDismiss} className="text-[var(--text-muted)] transition hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 min-h-[64px] text-sm leading-7 text-[var(--text-secondary)]">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : error ? (
              <p>{error}</p>
            ) : (
              <p className="space-y-2">{animatedText}</p>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
      >
        <RotateCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}
