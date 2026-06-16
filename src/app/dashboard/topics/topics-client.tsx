"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Brain, ExternalLink, Search } from "lucide-react";
import type { LeetCodeSolvedStats, LeetCodeSubmission, LeetCodeTopicStats } from "@/lib/leetcode";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

type TopicTier = "fundamental" | "intermediate" | "advanced";

type TopicItem = {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
  tier: TopicTier;
};

type TopicsClientProps = {
  username: string;
  topicStats: LeetCodeTopicStats | null;
  solvedStats: LeetCodeSolvedStats | null;
  submissions: LeetCodeSubmission[];
};

const TIER_LABELS: Record<TopicTier, string> = {
  fundamental: "Fundamental",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const PIE_COLORS = ["#7C3AED", "#22D3EE", "#34D399", "#FBBF24", "#F87171", "#F472B6", "#A78BFA", "#06B6D4"];

function flattenTopics(stats: LeetCodeTopicStats | null): TopicItem[] {
  if (!stats?.matchedUser?.tagProblemCounts) return [];
  const { fundamental, intermediate, advanced } = stats.matchedUser.tagProblemCounts;
  return [
    ...fundamental.map((t) => ({ ...t, tier: "fundamental" as const })),
    ...intermediate.map((t) => ({ ...t, tier: "intermediate" as const })),
    ...advanced.map((t) => ({ ...t, tier: "advanced" as const })),
  ].sort((a, b) => b.problemsSolved - a.problemsSolved);
}

function getSolvedByDifficulty(stats: LeetCodeSolvedStats | null) {
  const ac = stats?.matchedUser?.submitStats?.acSubmissionNum ?? [];
  return {
    easy: ac.find((s) => s.difficulty === "Easy")?.count ?? 0,
    medium: ac.find((s) => s.difficulty === "Medium")?.count ?? 0,
    hard: ac.find((s) => s.difficulty === "Hard")?.count ?? 0,
  };
}

export function TopicsClient({ username, topicStats, solvedStats, submissions }: TopicsClientProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const topics = useMemo(() => flattenTopics(topicStats), [topicStats]);
  const selected = topics.find((t) => t.tagSlug === selectedSlug) ?? topics[0] ?? null;

  const filteredTopics = useMemo(() => {
    const q = search.toLowerCase();
    return topics.filter((t) => t.tagName.toLowerCase().includes(q));
  }, [topics, search]);

  const donutData = useMemo(() => {
    if (!selected) return [];
    const total = topics.reduce((s, t) => s + t.problemsSolved, 0);
    const others = total - selected.problemsSolved;
    return [
      { name: selected.tagName, value: selected.problemsSolved },
      { name: "Other Topics", value: Math.max(0, others) },
    ];
  }, [selected, topics]);

  const lineData = useMemo(() => {
    const top = [...topics].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 8);
    return top.map((t, i) => ({
      label: t.tagName.length > 10 ? `${t.tagName.slice(0, 10)}…` : t.tagName,
      solved: t.problemsSolved,
      rank: i + 1,
    }));
  }, [topics]);

  const barData = useMemo(() => {
    const tiers: TopicTier[] = ["fundamental", "intermediate", "advanced"];
    return tiers.map((tier) => ({
      tier: TIER_LABELS[tier],
      solved: topics.filter((t) => t.tier === tier).reduce((s, t) => s + t.problemsSolved, 0),
      count: topics.filter((t) => t.tier === tier).length,
    }));
  }, [topics]);

  const solvedByDiff = getSolvedByDifficulty(solvedStats);

  const fetchInsight = async () => {
    if (!selected) return;
    setInsightLoading(true);
    setInsight("");
    try {
      const res = await fetch("/api/ai/topic-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selected.tagName,
          skillData: {
            solved: selected.problemsSolved,
            tier: selected.tier,
            slug: selected.tagSlug,
            totalTopics: topics.length,
            solvedByDifficulty: solvedByDiff,
          },
        }),
      });
      const data = (await res.json()) as { insight?: string; error?: string };
      setInsight(data.insight ?? data.error ?? "No insight available.");
    } catch {
      setInsight("Failed to generate insight. Please try again.");
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="w-full border-b border-[var(--border)] bg-[var(--bg-surface)] lg:w-72 lg:border-b-0 lg:border-r">
        <div className="p-4">
          <h2 className="text-lg font-bold">
            <span className="gradient-text">Topics</span>
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">@{username}</p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics…"
              className="pl-9"
            />
          </div>
        </div>
        <nav className="max-h-[40vh] overflow-y-auto px-2 pb-4 lg:max-h-[calc(100vh-12rem)]">
          {filteredTopics.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[var(--text-muted)]">No topics found</p>
          ) : (
            filteredTopics.map((topic) => (
              <button
                key={topic.tagSlug}
                type="button"
                onClick={() => setSelectedSlug(topic.tagSlug)}
                className={cn(
                  "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  (selectedSlug ?? topics[0]?.tagSlug) === topic.tagSlug
                    ? "bg-purple-500/15 text-white"
                    : "text-[var(--text-secondary)] hover:bg-white/5",
                )}
              >
                <span className="truncate font-medium">{topic.tagName}</span>
                <span className="ml-2 shrink-0 font-mono text-xs text-[var(--text-muted)]">
                  {topic.problemsSolved}
                </span>
              </button>
            ))
          )}
        </nav>
      </aside>

      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {selected ? (
          <>
            <motion.div {...fadeUp} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{selected.tagName}</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {TIER_LABELS[selected.tier]} · {selected.problemsSolved} problems solved
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://leetcode.com/tag/${selected.tagSlug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    LeetCode
                  </a>
                </Button>
                <Button size="sm" onClick={() => void fetchInsight()} disabled={insightLoading}>
                  <Brain className="h-4 w-4" />
                  {insightLoading ? "Analyzing…" : "AI Insight"}
                </Button>
              </div>
            </motion.div>

            {insight && (
              <motion.div {...fadeUp} className="glass-card p-5">
                <h3 className="mb-2 text-sm font-semibold text-[var(--purple-300)]">AI Insight</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                  {insight}
                </p>
              </motion.div>
            )}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <motion.div {...fadeUp} className="glass-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-white">Topic Share</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartGradients />
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div {...fadeUp} className="glass-card p-5 md:col-span-1 xl:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-white">Top Topics Progress</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <ChartGradients />
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="solved" name="Solved" stroke="#22D3EE" strokeWidth={2} dot={{ r: 4, fill: "#7C3AED" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div {...fadeUp} className="glass-card p-5 md:col-span-2 xl:col-span-3">
                <h3 className="mb-3 text-sm font-semibold text-white">Solved by Tier</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <ChartGradients />
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="tier" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="solved" name="Problems Solved" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            <motion.div {...fadeUp} className="glass-card overflow-hidden">
              <div className="border-b border-[var(--border)] p-5">
                <h3 className="text-sm font-semibold text-white">Recent Submissions</h3>
                <p className="text-xs text-[var(--text-muted)]">Your latest accepted submissions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                      <th className="px-4 py-3 font-medium">Problem</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Language</th>
                      <th className="px-4 py-3 font-medium">Runtime</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                          No submissions found
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <a
                              href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-white hover:text-[var(--purple-300)]"
                            >
                              {sub.title}
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                sub.status === "Accepted" ? "badge-ac" : "badge-wa",
                              )}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.language}</td>
                          <td className="px-4 py-3 font-mono text-[var(--text-muted)]">{sub.runtime}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">
                            {new Date(sub.timestamp * 1000).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center text-[var(--text-muted)]">
            No topic data available. Check your LeetCode username in settings.
          </div>
        )}
      </div>
    </div>
  );
}
