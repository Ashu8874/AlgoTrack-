"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AiDigestProps {
  username: string;
}

export function AiDigest({ username }: AiDigestProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [displayed, setDisplayed] = useState("");

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setDisplayed("");
    try {
      const res = await fetch(`/api/ai/digest?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setText(data.digest ?? data.insight ?? "Keep pushing — consistency beats intensity.");
    } catch {
      setText("Your progress is building momentum. Focus on one weak topic today.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  useEffect(() => {
    if (loading || !text) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, loading]);

  return (
    <div className="glass-card border-l-[3px] border-l-[var(--purple-500)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--purple-500)]/20 px-3 py-1 text-xs font-medium text-[var(--purple-300)]">
            ✨ AI Insight
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">Powered by Groq</span>
        </div>
        <button
          type="button"
          onClick={fetchDigest}
          className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--purple-300)]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="mt-4 min-h-[80px]">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{displayed}</p>
        )}
      </div>
    </div>
  );
}
