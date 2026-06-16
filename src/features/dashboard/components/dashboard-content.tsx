"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Percent, Zap } from "lucide-react";
import type { Types } from "mongoose";
import type {
  LeetCodeSolvedStats,
  LeetCodeContestInfo,
  LeetCodeSubmissionCalendar,
} from "@/lib/leetcode";
import { StatCard } from "./stat-card";
import { AiInsightCard } from "./ai-insight-card";
import { ActivityHeatmap } from "./activity-heatmap";
import { WeaknessChart } from "./weakness-chart";

interface UserData {
  _id: Types.ObjectId;
  leetcodeUsername: string;
  displayName?: string;
  name?: string;
}

type DashboardContentProps = {
  user: UserData;
  stats: LeetCodeSolvedStats | null;
  contest: LeetCodeContestInfo | null;
  submissions: LeetCodeSubmissionCalendar | null;
};

export function DashboardContent({
  user,
  stats,
  contest,
  submissions,
}: DashboardContentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalSolved =
    stats?.matchedUser?.submitStatsGlobal?.acSubmissionNum.find(
      (entry) => entry.difficulty === "All"
    )?.count || 0;

  const streak = submissions?.matchedUser?.userCalendar?.streak || 0;
  const rating = contest?.userContestRanking?.rating || 0;
  const topPercentage = contest?.userContestRanking?.topPercentage || 0;

  const stats_data = [
    {
      title: "Total Solved",
      value: totalSolved,
      icon: TrendingUp,
      color: "from-purple-600 to-purple-700",
    },
    {
      title: "Current Streak",
      value: streak,
      suffix: " days",
      icon: Flame,
      color: "from-orange-600 to-orange-700",
    },
    {
      title: "Contest Rating",
      value: rating,
      icon: Zap,
      color: "from-cyan-600 to-cyan-700",
    },
    {
      title: "Top Percentage",
      value: topPercentage,
      suffix: "%",
      icon: Percent,
      color: "from-green-600 to-green-700",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user.displayName || user.name}
        </h1>
        <p className="text-muted-foreground">
          @{user.leetcodeUsername} • Track your LeetCode progress
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats_data.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_0.9fr]">
        {/* AI Insights */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <AiInsightCard username={user.leetcodeUsername} />
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <ActivityHeatmap submissions={submissions} />
        </motion.div>

        {/* Weakness Analysis */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <WeaknessChart stats={stats} />
        </motion.div>
      </div>
    </motion.div>
  );
}
