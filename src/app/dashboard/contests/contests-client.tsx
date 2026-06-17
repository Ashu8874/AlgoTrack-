"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeUp, staggerContainer } from "@/lib/animations";
import type { LeetCodeContestInfo } from "@/lib/leetcode/types";

type ContestEntry = NonNullable<LeetCodeContestInfo["userContestRankingHistory"]>[number];

interface ContestsClientProps {
  contest: LeetCodeContestInfo;
  username: string;
}

interface RatingPoint {
  label: string;
  rating: number;
  change: number;
  problemsSolved: number;
  totalProblems: number;
  finishTime: number;
  attended: boolean;
  contestTitle: string;
}

const REFERENCE_LINES = [
  { value: 1400, label: "Specialist", color: "#F87171" },
  { value: 1600, label: "Expert", color: "#FBBF24" },
  { value: 1900, label: "Knight", color: "#34D399" },
  { value: 2200, label: "Guardian", color: "#A78BFA" },
];

function shortenTitle(title: string, max = 14) {
  return title.length > max ? `${title.slice(0, max)}…` : title;
}

function buildRatingJourney(history: ContestEntry[]): RatingPoint[] {
  return history
    .filter((e) => e.attended && typeof e.rating === "number")
    .map((entry, index, arr) => {
      const prev = index > 0 ? arr[index - 1].rating ?? entry.rating! : entry.rating!;
      const title = entry.contest?.title ?? `Contest ${index + 1}`;
      return {
        label: shortenTitle(title),
        rating: entry.rating!,
        change: entry.rating! - (prev ?? entry.rating!),
        problemsSolved: entry.problemsSolved ?? 0,
        totalProblems: entry.totalProblems ?? 4,
        finishTime: entry.finishTimeInSeconds ?? 0,
        attended: entry.attended ?? true,
        contestTitle: title,
      };
    });
}

function buildRatingChangeBuckets(points: RatingPoint[]) {
  const buckets = new Map<string, number>();
  for (let i = -100; i <= 100; i += 20) {
    buckets.set(`${i}`, 0);
  }
  points.forEach((p, i) => {
    if (i === 0) return;
    const change = p.change;
    const bucket = Math.floor(change / 20) * 20;
    const clamped = Math.max(-100, Math.min(100, bucket));
    const key = `${clamped}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return Array.from(buckets.entries()).map(([bucket, count]) => ({
    bucket: Number(bucket),
    label: bucket.startsWith("-") ? bucket : `+${bucket}`,
    count,
  }));
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function RatingDot(props: { cx?: number; cy?: number; payload?: RatingPoint }) {
  const { cx = 0, cy = 0, payload } = props;
  const color = (payload?.change ?? 0) >= 0 ? "#34D399" : "#F87171";
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#0D0D1A" strokeWidth={2} />;
}

export function ContestsClient({ contest, username }: ContestsClientProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  const history = useMemo(
    () => contest.userContestRankingHistory ?? [],
    [contest.userContestRankingHistory],
  );
  const ratingPoints = useMemo(() => buildRatingJourney(history), [history]);
  const ranking = contest.userContestRanking;

  const problemsPerContest = ratingPoints.map((p) => ({
    label: p.label,
    solved: p.problemsSolved,
    total: p.totalProblems,
    fill:
      p.problemsSolved >= p.totalProblems
        ? "#34D399"
        : p.problemsSolved > 0
          ? "#FBBF24"
          : "#F87171",
  }));

  const ratingBuckets = useMemo(() => buildRatingChangeBuckets(ratingPoints), [ratingPoints]);

  const bestContests = [...ratingPoints]
    .sort((a, b) => b.change - a.change || b.problemsSolved - a.problemsSolved)
    .slice(0, 5);

  const worstContests = [...ratingPoints]
    .sort((a, b) => a.change - b.change || a.problemsSolved - b.problemsSolved)
    .slice(0, 5);

  const attended = ranking?.attendedContestsCount ?? ratingPoints.length;
  const rankValues = history
    .filter((e) => e.attended && typeof e.ranking === "number")
    .map((e) => e.ranking as number);
  const bestRank = rankValues.length ? Math.min(...rankValues) : (ranking?.globalRanking ?? null);
  const avgProblems =
    ratingPoints.length > 0
      ? (ratingPoints.reduce((s, p) => s + p.problemsSolved, 0) / ratingPoints.length).toFixed(1)
      : "0";
  const ratingChange30d =
    ratingPoints.length >= 2
      ? ratingPoints[ratingPoints.length - 1].rating - ratingPoints[Math.max(0, ratingPoints.length - 5)].rating
      : 0;

  const stats = [
    { label: "Contests Attended", value: attended, icon: Trophy, color: "#FBBF24" },
    { label: "Best Rank", value: bestRank ?? "—", icon: Award, color: "#A78BFA" },
    { label: "Avg Problems", value: avgProblems, icon: Target, color: "#22D3EE" },
    {
      label: "Rating Δ (recent)",
      value: `${ratingChange30d >= 0 ? "+" : ""}${Math.round(ratingChange30d)}`,
      icon: TrendingUp,
      color: ratingChange30d >= 0 ? "#34D399" : "#F87171",
    },
  ];

  useEffect(() => {
    const summary = `Contest performance for ${username}: current rating ${ranking?.rating ?? "unknown"}, attended ${attended} contests, recent rating changes: ${ratingPoints
      .slice(-5)
      .map((p) => `${p.contestTitle} (${p.change >= 0 ? "+" : ""}${p.change})`)
      .join(", ")}. Avg problems solved: ${avgProblems}.`;
    fetch("/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: summary, type: "approach" }),
    })
      .then((r) => r.json())
      .then((d: { hint?: string }) => setAiAnalysis(d.hint ?? "Keep practicing timed contests to improve consistency."))
      .catch(() =>
        setAiAnalysis(
          "Your contest performance shows room for growth. Focus on warmup routines before contests and practice 25-minute timed sessions on medium problems.",
        ),
      )
      .finally(() => setAiLoading(false));
  }, [username, ranking?.rating, attended, ratingPoints, avgProblems]);

  if (!ratingPoints.length) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <h1 className="text-3xl font-bold gradient-text">Contest Analytics</h1>
        <div className="glass-card p-8 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-[var(--amber-400)]" />
          <p className="text-[var(--text-secondary)]">No contest history found. Join a weekly contest to start tracking!</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 p-6 lg:p-8" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp}>
        <h1 className="text-3xl font-bold gradient-text">Contest Analytics</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Deep dive into your contest performance · Current rating{" "}
          <span className="font-semibold text-[var(--purple-300)]">{ranking?.rating?.toFixed(0) ?? "—"}</span>
        </p>
      </motion.div>

      <motion.div {...fadeUp} className="glass-card chart-wrapper p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Rating Journey</h2>
        <div className="h-[280px] w-full md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ratingPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <ChartGradients />
              <ReferenceArea y1={0} y2={1400} fill="rgba(248,113,113,0.05)" />
              <ReferenceArea y1={1400} y2={1600} fill="rgba(251,191,36,0.05)" />
              <ReferenceArea y1={1600} y2={1900} fill="rgba(52,211,153,0.05)" />
              <ReferenceArea y1={1900} y2={3000} fill="rgba(139,92,246,0.05)" />
              {REFERENCE_LINES.map((ref) => (
                <ReferenceLine
                  key={ref.value}
                  y={ref.value}
                  stroke={ref.color}
                  strokeDasharray="4 4"
                  label={{ value: ref.label, fill: ref.color, fontSize: 10 }}
                />
              ))}
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#64748B", fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const p = payload[0].payload as RatingPoint;
                  return (
                    <CustomTooltip
                      active
                      label={p.contestTitle}
                      payload={[
                        { name: "Rating", value: p.rating, color: "#A78BFA" },
                        { name: "Change", value: `${p.change >= 0 ? "+" : ""}${p.change}`, color: p.change >= 0 ? "#34D399" : "#F87171" },
                        { name: "Solved", value: `${p.problemsSolved}/${p.totalProblems}`, color: "#22D3EE" },
                        { name: "Time", value: formatDuration(p.finishTime), color: "#FBBF24" },
                      ]}
                    />
                  );
                }}
              />
              <Line type="monotone" dataKey="rating" stroke="#7C3AED" strokeWidth={2.5} dot={<RatingDot />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div {...fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</p>
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <p className="mt-2 text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div {...fadeUp} className="glass-card chart-wrapper p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Problems Solved per Contest</h2>
          <div className="h-[240px] w-full md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={problemsPerContest}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="solved" radius={[6, 6, 0, 0]}>
                  {problemsPerContest.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="glass-card chart-wrapper p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Rating Change Distribution</h2>
          <div className="h-[240px] w-full md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingBuckets}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeUp} className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-5 py-4 text-lg font-semibold text-[var(--green-400)]">
            Best Performances
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="px-5 py-3">Contest</th>
                  <th className="px-5 py-3">Solved</th>
                  <th className="px-5 py-3">Δ Rating</th>
                </tr>
              </thead>
              <tbody>
                {bestContests.map((c) => (
                  <tr key={c.contestTitle} className="border-t border-[var(--border)]">
                    <td className="px-5 py-3 text-[var(--text-primary)]">{c.contestTitle}</td>
                    <td className="px-5 py-3">{c.problemsSolved}/{c.totalProblems}</td>
                    <td className="px-5 py-3 text-[var(--green-400)]">+{c.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-5 py-4 text-lg font-semibold text-[var(--red-400)]">
            Worst Performances
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="px-5 py-3">Contest</th>
                  <th className="px-5 py-3">Solved</th>
                  <th className="px-5 py-3">Δ Rating</th>
                </tr>
              </thead>
              <tbody>
                {worstContests.map((c) => (
                  <tr key={c.contestTitle} className="border-t border-[var(--border)]">
                    <td className="px-5 py-3 text-[var(--text-primary)]">{c.contestTitle}</td>
                    <td className="px-5 py-3">{c.problemsSolved}/{c.totalProblems}</td>
                    <td className="px-5 py-3 text-[var(--red-400)]">{c.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp} className="glass-card p-5 md:p-6">
        <h2 className="mb-3 text-lg font-semibold gradient-text">AI Contest Analysis</h2>
        {aiLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <p className="leading-relaxed text-[var(--text-secondary)]">{aiAnalysis}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
