"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import type {
  LeetCodeContestInfo,
  LeetCodeSolvedStats,
  LeetCodeSubmissionCalendar,
  LeetCodeTopicStats,
} from "@/lib/leetcode";

interface DashboardChartsProps {
  stats: LeetCodeSolvedStats;
  contest: LeetCodeContestInfo;
  calendar: LeetCodeSubmissionCalendar;
  topicStats: LeetCodeTopicStats;
  snapshots: Array<{ date: Date; totalSolved: number }>;
}

const TOPIC_COLORS = ["#7C3AED", "#22D3EE", "#34D399", "#FBBF24", "#F87171", "#F472B6", "#818CF8", "#2DD4BF"];

function parseCalendar(json?: string) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as Record<string, number>;
    return Object.entries(parsed)
      .map(([ts, count]) => ({
        timestamp: parseInt(ts, 10),
        label: new Date(parseInt(ts, 10) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        submissions: count,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

function getTopTopics(topicStats: LeetCodeTopicStats) {
  const all = [
    ...(topicStats.matchedUser?.tagProblemCounts.advanced ?? []),
    ...(topicStats.matchedUser?.tagProblemCounts.intermediate ?? []),
    ...(topicStats.matchedUser?.tagProblemCounts.fundamental ?? []),
  ];

  const map = new Map<string, number>();
  all.forEach((t) => map.set(t.tagName, (map.get(t.tagName) ?? 0) + t.problemsSolved));

  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function DashboardCharts({ contest, calendar, topicStats, snapshots }: DashboardChartsProps) {
  const dailyData = parseCalendar(calendar.matchedUser?.userCalendar?.submissionCalendar);
  const cumulativeData = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    totalSolved: s.totalSolved,
  }));

  const topTopics = getTopTopics(topicStats);
  const radialData = topTopics.map((topic, index) => ({
    name: topic.name,
    value: topic.value,
    fill: TOPIC_COLORS[index % TOPIC_COLORS.length],
  }));

  const maxTopic = Math.max(...topTopics.map((t) => t.value), 1);
  const radarData = topTopics.map((topic) => ({
    topic: topic.name.length > 14 ? `${topic.name.slice(0, 14)}…` : topic.name,
    value: Math.round((topic.value / maxTopic) * 100),
  }));

  const contestHistory = (contest.userContestRankingHistory ?? [])
    .filter((h) => h.attended)
    .map((h, i) => ({
      name: h.contest?.title?.slice(0, 14) ?? `C${i + 1}`,
      rating: h.rating ?? 0,
      problemsSolved: h.problemsSolved ?? 0,
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-card chart-wrapper p-6">
        <h3 className="mb-4 text-lg font-semibold">Daily Submissions</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyData.slice(-30)}>
            <ChartGradients />
            <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} interval={4} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
            <CustomTooltip />
            <Bar dataKey="submissions" fill="url(#barGrad)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card chart-wrapper p-6">
        <h3 className="mb-4 text-lg font-semibold">Cumulative Progress</h3>
        {cumulativeData.length < 2 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-[var(--text-muted)]">Sync more days to see progress trend</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cumulativeData}>
              <ChartGradients />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
              <CustomTooltip />
              <Area type="monotone" dataKey="totalSolved" stroke="#7C3AED" strokeWidth={2} fill="url(#purpleGrad)" dot={false} isAnimationActive animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-card chart-wrapper p-6">
        <h3 className="mb-4 text-lg font-semibold">Topic Distribution</h3>
        <ResponsiveContainer width="100%" height={320}>
          <RadialBarChart innerRadius="20%" outerRadius="90%" data={radialData}>
            <RadialBar dataKey="value" isAnimationActive animationDuration={900} />
            <Legend />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card chart-wrapper p-6">
        <h3 className="mb-4 text-lg font-semibold">Skill Radar</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="topic" tick={{ fill: "#64748B", fontSize: 11 }} />
            <Radar dataKey="value" stroke="#7C3AED" fill="rgba(124,58,237,0.2)" isAnimationActive animationDuration={900} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card chart-wrapper p-6 lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold">Contest Rating Journey</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={contestHistory}>
            <ChartGradients />
            <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: "#64748B", fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748B", fontSize: 11 }} />
            <ReferenceLine yAxisId="left" y={1400} stroke="#FBBF24" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" y={1600} stroke="#34D399" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" y={1900} stroke="#8B5CF6" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" y={2200} stroke="#A78BFA" strokeDasharray="3 3" />
            <CustomTooltip />
            <Bar yAxisId="right" dataKey="problemsSolved" fill="rgba(34,211,238,0.2)" isAnimationActive animationDuration={900} />
            <Line yAxisId="left" type="monotone" dataKey="rating" stroke="#A78BFA" strokeWidth={2} dot={{ r: 4, fill: "#A78BFA" }} isAnimationActive animationDuration={900} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
