"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface QueueProblem {
  title: string;
  slug: string;
  difficulty: string;
  topic: string;
  reason?: string;
  estimatedMinutes: number;
}

interface ProblemQueueProps {
  username: string;
}

function difficultyBadge(d: string) {
  const lower = d.toLowerCase();
  if (lower === "easy") return "badge-easy";
  if (lower === "hard") return "badge-hard";
  return "badge-medium";
}

export function ProblemQueue({ username }: ProblemQueueProps) {
  const [queue, setQueue] = useState<QueueProblem[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(`queue-done-${username}`);
    if (stored) setDone(new Set(JSON.parse(stored) as string[]));
  }, [username]);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/queue?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setQueue(data.queue ?? []);
      setTotalMinutes(data.totalEstimatedMinutes ?? 0);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const toggleDone = (slug: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      localStorage.setItem(`queue-done-${username}`, JSON.stringify([...next]));
      return next;
    });
  };

  const completed = queue.filter((p) => done.has(p.slug)).length;

  return (
    <div className="glass-card border-l-[3px] border-l-[var(--cyan-400)] p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">📋 Today&apos;s Queue</h3>
        <span className="rounded-full bg-[var(--cyan-400)]/10 px-3 py-1 text-xs text-[var(--cyan-400)]">
          ⏱ {totalMinutes} min total
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : (
          queue.map((problem) => (
            <div
              key={problem.slug}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-[var(--cyan-400)]/30"
            >
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyBadge(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <Link
                href={`https://leetcode.com/problems/${problem.slug}`}
                target="_blank"
                className="flex-1 truncate text-sm font-medium text-[var(--text-primary)] hover:text-[var(--cyan-400)]"
              >
                {problem.title}
              </Link>
              <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-muted)] sm:inline">
                {problem.topic}
              </span>
              <span className="text-xs text-[var(--text-muted)]">⏱ {problem.estimatedMinutes}m</span>
              <input
                type="checkbox"
                checked={done.has(problem.slug)}
                onChange={() => toggleDone(problem.slug)}
                className="accent-[var(--cyan-400)]"
                title="Mark as done"
              />
            </div>
          ))
        )}
      </div>
      {!loading && queue.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-[var(--text-muted)]">{completed}/{queue.length} completed</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--cyan-400)] to-[var(--purple-400)] transition-all"
              style={{ width: `${(completed / queue.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
