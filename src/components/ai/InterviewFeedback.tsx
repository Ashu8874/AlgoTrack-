"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const verdictStyles: Record<string, string> = {
  "Would hire": "bg-emerald-500/10 text-emerald-200",
  Maybe: "bg-amber-500/10 text-amber-200",
  "Would not hire": "bg-red-500/10 text-red-200",
};

type InterviewFeedbackData = {
  interviewerVerdict?: string;
  verdictReason?: string;
  strengths?: string[];
  redFlags?: string[];
  mustStudyBefore?: string[];
  improvedScoreRequires?: string;
  encouragement?: string;
  nextProblem?: { title?: string; slug?: string; reason?: string };
  score?: number;
  verdict?: string;
  whatWentWell?: string;
  whatToImprove?: string;
  motivationalLine?: string;
};

export default function InterviewFeedback({ company, difficulty, problem, notes, score, hintsUsed, duration }: { company: string; difficulty: string; problem: string; notes: string; score: number; hintsUsed: number; duration: number; }) {
  const [data, setData] = useState<InterviewFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedback = useCallback(async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const res = await fetch("/api/ai/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, difficulty, notes, score, hintsUsed, duration, refresh }),
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
  }, [company, difficulty, notes, score, hintsUsed, duration]);

  useEffect(() => {
    void fetchFeedback();
  }, [fetchFeedback]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-5">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--text-muted)]">AI unavailable</p>;
  }

  const verdict = data?.interviewerVerdict ?? data?.verdict ?? "Maybe";

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">✨ AI</span>
          <h3 className="mt-3 text-lg font-semibold text-white">Mock Interview Feedback</h3>
        </div>
        <button type="button" onClick={() => void fetchFeedback(true)} className="text-[var(--text-muted)] transition hover:text-white">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className={`mt-5 rounded-3xl p-4 ${verdictStyles[verdict] ?? verdictStyles.Maybe}`}>
        <p className="text-sm text-white">Interviewer Verdict</p>
        <p className="mt-2 text-2xl font-bold text-white">{verdict}</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{data?.verdictReason}</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Problem: {problem}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Strengths</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {Array.isArray(data?.strengths) ? data.strengths.map((item: string) => (
              <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-emerald-400" />{item}</li>
            )) : null}
          </ul>
        </div>
        <div className="rounded-3xl bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Red Flags</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {Array.isArray(data?.redFlags) ? data.redFlags.map((item: string) => (
              <li key={item} className="flex items-start gap-2"><XCircle className="mt-1 h-4 w-4 text-red-400" />{item}</li>
            )) : null}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Must Study Before Next Attempt</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.isArray(data?.mustStudyBefore) ? data.mustStudyBefore.map((topic: string) => (
            <span key={topic} className="rounded-full bg-purple-500/10 px-3 py-1 text-sm text-purple-200">{topic}</span>
          )) : null}
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">What it takes to score 90+</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{data?.improvedScoreRequires}</p>
      </div>

      <p className="mt-5 text-sm italic text-purple-300">{data?.encouragement ?? data?.motivationalLine}</p>
    </div>
  );
}
