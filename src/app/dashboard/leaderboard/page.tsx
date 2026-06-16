"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Copy, Plus, RefreshCw, Swords, Users } from "lucide-react";
import { ChartGradients } from "@/components/charts/chart-gradients";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  username: string;
  avatar: string;
  realName: string;
  totalSolved: number;
  rating: number;
  streak: number;
  thisWeek: number;
  easy: number;
  medium: number;
  hard: number;
  isCurrentUser: boolean;
}

type SortKey = "totalSolved" | "thisWeek" | "streak" | "rating" | "hard";
type SortTab = "overall" | "week" | "streak" | "rating" | "hard";

const SORT_TABS: { id: SortTab; label: string; key: SortKey }[] = [
  { id: "overall", label: "Overall", key: "totalSolved" },
  { id: "week", label: "This Week", key: "thisWeek" },
  { id: "streak", label: "Streak", key: "streak" },
  { id: "rating", label: "Rating", key: "rating" },
  { id: "hard", label: "Hard", key: "hard" },
];

const FRIEND_COLORS = ["#7C3AED", "#22D3EE", "#34D399", "#FBBF24", "#F87171", "#F472B6", "#60A5FA", "#2DD4BF"];

const RADAR_AXES = ["Easy", "Medium", "Hard", "Rating", "Streak", "This Week", "Total", "Rank"] as const;

function rankEmoji(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
}

function normalize(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.round((value / max) * 100);
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendUsername, setFriendUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [sortTab, setSortTab] = useState<SortTab>("overall");
  const [sortAsc, setSortAsc] = useState(false);
  const [hiddenFriends, setHiddenFriends] = useState<Set<string>>(new Set());
  const [challengeText, setChallengeText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to load leaderboard");
      const data = (await res.json()) as { leaderboard: LeaderboardEntry[] };
      setEntries(data.leaderboard ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeaderboard();
    const interval = setInterval(() => void fetchLeaderboard(), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const sortKey = SORT_TABS.find((t) => t.id === sortTab)?.key ?? "totalSolved";

  const sorted = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      const diff = (a[sortKey] as number) - (b[sortKey] as number);
      return sortAsc ? diff : -diff;
    });
    return copy;
  }, [entries, sortKey, sortAsc]);

  const visibleEntries = sorted.filter((e) => !hiddenFriends.has(e.username));

  const maxValues = useMemo(() => {
    const max = (key: keyof LeaderboardEntry) =>
      Math.max(...entries.map((e) => (typeof e[key] === "number" ? (e[key] as number) : 0)), 1);
    return {
      easy: max("easy"),
      medium: max("medium"),
      hard: max("hard"),
      rating: max("rating"),
      streak: max("streak"),
      thisWeek: max("thisWeek"),
      totalSolved: max("totalSolved"),
    };
  }, [entries]);

  const radarData = RADAR_AXES.map((axis) => {
    const row: Record<string, string | number> = { axis };
    visibleEntries.forEach((entry) => {
      const map: Record<string, number> = {
        Easy: normalize(entry.easy, maxValues.easy),
        Medium: normalize(entry.medium, maxValues.medium),
        Hard: normalize(entry.hard, maxValues.hard),
        Rating: normalize(entry.rating, maxValues.rating),
        Streak: normalize(entry.streak, maxValues.streak),
        "This Week": normalize(entry.thisWeek, maxValues.thisWeek),
        Total: normalize(entry.totalSolved, maxValues.totalSolved),
        Rank: normalize(
          sorted.length - sorted.findIndex((e) => e.username === entry.username),
          sorted.length,
        ),
      };
      row[entry.username] = map[axis];
    });
    return row;
  });

  const weeklyRace = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    return days.map((day, i) => {
      const row: Record<string, string | number> = { day };
      entries.forEach((entry) => {
        const daily = i <= dayIndex ? Math.round((entry.thisWeek / (dayIndex + 1)) * (i + 1)) : 0;
        row[entry.username] = daily;
      });
      return row;
    });
  }, [entries]);

  const streakData = sorted
    .map((e) => ({ username: e.username, streak: e.streak, isCurrentUser: e.isCurrentUser }))
    .sort((a, b) => b.streak - a.streak);

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!friendUsername.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leetcodeUsername: friendUsername.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add friend");
      setFriendUsername("");
      await fetchLeaderboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend");
    } finally {
      setAdding(false);
    }
  }

  function handleChallenge(friend: LeaderboardEntry) {
    const text = `Challenge @${friend.username} to solve 3 Hard problems this week! 🏆 Who's in?`;
    setChallengeText(text);
    setCopied(false);
  }

  async function copyChallenge() {
    if (!challengeText) return;
    await navigator.clipboard.writeText(challengeText);
    setCopied(true);
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 p-6 lg:p-8" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div {...fadeUp} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Friends Leaderboard</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Compete with friends across multiple metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchLeaderboard()} className="border-[var(--border)]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </motion.div>

      <motion.form {...fadeUp} onSubmit={handleAddFriend} className="glass-card flex flex-wrap gap-3 p-4">
        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <Users className="h-5 w-5 text-[var(--cyan-400)]" />
          <Input
            placeholder="Add friend by LeetCode username"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            className="border-[var(--border)] bg-[var(--bg-surface)]"
          />
        </div>
        <Button type="submit" disabled={adding}>
          <Plus className="mr-2 h-4 w-4" />
          {adding ? "Adding…" : "Add Friend"}
        </Button>
      </motion.form>

      {error && <p className="text-sm text-[var(--red-400)]">{error}</p>}

      <motion.div {...fadeUp} className="flex flex-wrap gap-2">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (sortTab === tab.id) setSortAsc((v) => !v);
              else {
                setSortTab(tab.id);
                setSortAsc(false);
              }
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              sortTab === tab.id
                ? "bg-[var(--purple-500)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      <motion.div {...fadeUp} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => setSortTab("overall")}>Total</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => setSortTab("rating")}>Rating</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => setSortTab("streak")}>Streak</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => setSortTab("week")}>This Week</th>
                <th className="px-4 py-3">E/M/H</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, index) => (
                <tr
                  key={entry.username}
                  className={cn(
                    "border-b border-[var(--border)] transition-colors",
                    entry.isCurrentUser && "bg-[rgba(124,58,237,0.12)]",
                  )}
                >
                  <td className="px-4 py-3 font-medium">{rankEmoji(index + 1)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entry.avatar ? (
                        <Image src={entry.avatar} alt="" width={28} height={28} className="rounded-full" unoptimized />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-card)] text-xs">
                          {entry.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`https://leetcode.com/${entry.username}`}
                          target="_blank"
                          className="font-medium text-[var(--text-primary)] hover:text-[var(--purple-300)]"
                        >
                          {entry.username}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)]">{entry.realName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{entry.totalSolved}</td>
                  <td className="px-4 py-3">{Math.round(entry.rating)}</td>
                  <td className="px-4 py-3">{entry.streak}🔥</td>
                  <td className="px-4 py-3">{entry.thisWeek}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-[var(--green-400)]">{entry.easy}</span>/
                    <span className="text-[var(--amber-400)]">{entry.medium}</span>/
                    <span className="text-[var(--red-400)]">{entry.hard}</span>
                  </td>
                  <td className="px-4 py-3">
                    {!entry.isCurrentUser && (
                      <Button variant="ghost" size="sm" onClick={() => handleChallenge(entry)}>
                        <Swords className="mr-1 h-4 w-4" />
                        Challenge
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {challengeText && (
        <motion.div {...fadeUp} className="glass-card flex flex-wrap items-center gap-3 p-4">
          <p className="flex-1 text-sm text-[var(--text-secondary)]">{challengeText}</p>
          <Button size="sm" onClick={() => void copyChallenge()}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div {...fadeUp} className="glass-card chart-wrapper p-4 md:p-6 xl:col-span-2">
          <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Skill Radar Comparison</h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">Click legend to toggle friends</p>
          <div className="h-[280px] w-full md:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#64748B", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  onClick={(e) => {
                    const key = e.dataKey as string;
                    if (!key) return;
                    setHiddenFriends((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                  }}
                />
                {entries.map((entry, i) =>
                  hiddenFriends.has(entry.username) ? null : (
                    <Radar
                      key={entry.username}
                      name={entry.username}
                      dataKey={entry.username}
                      stroke={FRIEND_COLORS[i % FRIEND_COLORS.length]}
                      fill={FRIEND_COLORS[i % FRIEND_COLORS.length]}
                      fillOpacity={entry.isCurrentUser ? 0.35 : 0.15}
                      strokeWidth={entry.isCurrentUser ? 2.5 : 1.5}
                    />
                  ),
                )}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="glass-card chart-wrapper p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Weekly Progress Race</h2>
          <div className="h-[240px] w-full md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyRace}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {entries.map((entry, i) => (
                  <Line
                    key={entry.username}
                    type="monotone"
                    dataKey={entry.username}
                    stroke={FRIEND_COLORS[i % FRIEND_COLORS.length]}
                    strokeWidth={entry.isCurrentUser ? 3 : 1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="glass-card chart-wrapper p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Streak Leaderboard</h2>
          <div className="h-[240px] w-full md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} layout="vertical" margin={{ left: 20 }}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis type="category" dataKey="username" width={80} tick={{ fill: "#64748B", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="streak" radius={[0, 6, 6, 0]}>
                  {streakData.map((entry) => (
                    <Cell
                      key={entry.username}
                      fill={entry.isCurrentUser ? "#7C3AED" : "url(#barGrad)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
