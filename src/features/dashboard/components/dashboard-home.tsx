"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, RefreshCw } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { StatCardSolved } from "./stat-card-solved";
import { StatCardRating } from "./stat-card-rating";
import { StatCardStreak } from "./stat-card-streak";
import { StatCardAcceptance } from "./stat-card-acceptance";
import { DifficultyCard } from "./difficulty-card";
import { SubmissionHeatmap } from "./submission-heatmap";
import { AiDigest } from "./ai-digest";
import { ProblemQueue } from "./problem-queue";
import { LanguageChart } from "./language-chart";
import { DashboardCharts } from "./dashboard-charts";
import type {
  LeetCodeContestInfo,
  LeetCodeLanguageStat,
  LeetCodeBeatsStats,
  LeetCodeSolvedStats,
  LeetCodeSubmissionCalendar,
  LeetCodeMatchedUserProfile,
  LeetCodeTopicStats,
} from "@/lib/leetcode";

interface DashboardHomeProps {
  username: string;
  displayName: string;
  profile: LeetCodeMatchedUserProfile;
  stats: LeetCodeSolvedStats;
  contest: LeetCodeContestInfo;
  calendar: LeetCodeSubmissionCalendar;
  topicStats: LeetCodeTopicStats;
  languages: LeetCodeLanguageStat[];
  beats: LeetCodeBeatsStats;
  snapshots: Array<{ date: string; totalSolved: number }>;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getAcCount(stats: LeetCodeSolvedStats, difficulty: string) {
  const ac =
    stats.matchedUser?.submitStatsGlobal?.acSubmissionNum ??
    stats.matchedUser?.submitStats?.acSubmissionNum ??
    [];
  return ac.find((e) => e.difficulty === difficulty)?.count ?? 0;
}

function getTotalSubmissions(stats: LeetCodeSolvedStats, difficulty: string) {
  const total =
    stats.matchedUser?.submitStatsGlobal?.totalSubmissionNum ??
    stats.matchedUser?.submitStats?.totalSubmissionNum ??
    [];
  return total.find((e) => e.difficulty === difficulty)?.submissions ?? 0;
}

function getLast7Days(calendarJson?: string) {
  const map = new Map<string, number>();
  if (calendarJson) {
    try {
      const parsed = JSON.parse(calendarJson) as Record<string, number>;
      Object.entries(parsed).forEach(([ts, count]) => {
        const d = new Date(parseInt(ts, 10) * 1000);
        const key = d.toISOString().split("T")[0];
        map.set(key, (map.get(key) ?? 0) + count);
      });
    } catch { /* empty */ }
  }
  const days: Array<{ day: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), count: map.get(key) ?? 0 });
  }
  return days;
}

export function DashboardHome({
  username,
  displayName,
  stats,
  contest,
  calendar,
  topicStats,
  languages,
  beats,
  snapshots,
}: DashboardHomeProps) {
  const [syncing, setSyncing] = useState(false);

  const totalSolved = getAcCount(stats, "All");
  const maxProblems = stats.allQuestionsCount.find((q) => q.difficulty === "All")?.count ?? 3267;
  const easySolved = getAcCount(stats, "Easy");
  const mediumSolved = getAcCount(stats, "Medium");
  const hardSolved = getAcCount(stats, "Hard");
  const easyTotal = stats.allQuestionsCount.find((q) => q.difficulty === "Easy")?.count ?? 0;
  const mediumTotal = stats.allQuestionsCount.find((q) => q.difficulty === "Medium")?.count ?? 0;
  const hardTotal = stats.allQuestionsCount.find((q) => q.difficulty === "Hard")?.count ?? 0;

  const accepted = getAcCount(stats, "All")
    ? (stats.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? stats.matchedUser?.submitStats?.acSubmissionNum ?? [])
        .find((e) => e.difficulty === "All")?.submissions ?? 0
    : 0;
  const totalSubs = getTotalSubmissions(stats, "All");
  const acceptanceRate = totalSubs > 0 ? Math.round((accepted / totalSubs) * 100) : 0;

  const rating = contest.userContestRanking?.rating ?? 0;
  const globalRanking = contest.userContestRanking?.globalRanking ?? 0;
  const history = (contest.userContestRankingHistory ?? [])
    .filter((h) => h.attended && typeof h.rating === "number")
    .map((h) => ({ rating: h.rating as number }));

  const cal = calendar.matchedUser?.userCalendar;
  const streak = cal?.streak ?? 0;
  const maxStreak = streak;
  const totalActiveDays = cal?.totalActiveDays ?? 0;
  const year = new Date().getFullYear();

  const handleSync = async () => {
    setSyncing(true);
    await fetch(`/api/profile/${encodeURIComponent(username)}`, { cache: "no-store" });
    window.location.reload();
  };

  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.section variants={fadeUp} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            {getGreeting()}, {displayName.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">Here&apos;s your LeetCode overview for today</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`https://leetcode.com/${username}`}
            target="_blank"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--purple-400)]/40"
          >
            @{username}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-[var(--purple-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--purple-400)] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sync Data
          </button>
        </div>
      </motion.section>

      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCardSolved total={totalSolved} max={maxProblems} easy={easySolved} medium={mediumSolved} hard={hardSolved} />
        <StatCardRating rating={rating} globalRanking={globalRanking} history={history} />
        <StatCardStreak streak={streak} maxStreak={maxStreak} last7Days={getLast7Days(cal?.submissionCalendar)} />
        <StatCardAcceptance rate={acceptanceRate} accepted={accepted} total={totalSubs} />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-3">
        <DifficultyCard label="Easy" solved={easySolved} total={easyTotal} beats={Math.round(beats.easy)} theme="easy" />
        <DifficultyCard label="Medium" solved={mediumSolved} total={mediumTotal} beats={Math.round(beats.medium)} theme="medium" />
        <DifficultyCard label="Hard" solved={hardSolved} total={hardTotal} beats={Math.round(beats.hard)} theme="hard" />
      </motion.div>

      <motion.div variants={fadeUp}>
        <SubmissionHeatmap
          submissionCalendar={cal?.submissionCalendar}
          streak={streak}
          maxStreak={maxStreak}
          totalActiveDays={totalActiveDays}
          year={year}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-2">
        <AiDigest username={username} />
        <ProblemQueue username={username} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <LanguageChart languages={languages} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <DashboardCharts
          stats={stats}
          contest={contest}
          calendar={calendar}
          topicStats={topicStats}
          snapshots={snapshots}
        />
      </motion.div>
    </motion.div>
  );
}
