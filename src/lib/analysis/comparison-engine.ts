import type {
  LeetCodeContestInfo,
  LeetCodeMatchedUserProfile,
  LeetCodeSolvedStats,
  LeetCodeSubmissionCalendar,
} from "@/lib/leetcode";

export type ComparisonInput = {
  username: string;
  profile: LeetCodeMatchedUserProfile;
  solvedStats: LeetCodeSolvedStats;
  contestInfo: LeetCodeContestInfo;
  submissionCalendar: LeetCodeSubmissionCalendar;
};

export type ComparisonMetricKey = "solved" | "rating" | "ranking" | "streak";

export type ComparisonRow = {
  username: string;
  solved: number;
  rating: number | null;
  ranking: number | null;
  streak: number | null;
  deltas: Record<ComparisonMetricKey, number | null>;
  winnerMetrics: ComparisonMetricKey[];
};

export type ComparisonReport = {
  rows: ComparisonRow[];
  leaders: Record<ComparisonMetricKey, string | null>;
  metricNames: Record<ComparisonMetricKey, string>;
};

function getSolvedTotal(stats: LeetCodeSolvedStats) {
  return (
    stats.matchedUser?.submitStatsGlobal?.acSubmissionNum.find((entry) => entry.difficulty === "All")?.count ??
    stats.matchedUser?.submitStats?.acSubmissionNum.find((entry) => entry.difficulty === "All")?.count ??
    0
  );
}

function getRanking(input: ComparisonInput) {
  return input.profile.profile?.ranking ?? input.contestInfo.userContestRanking?.globalRanking ?? null;
}

function getRating(input: ComparisonInput) {
  return input.contestInfo.userContestRanking?.rating ?? null;
}

function getStreak(input: ComparisonInput) {
  return input.submissionCalendar.matchedUser?.userCalendar?.streak ?? null;
}

function bestMetricValue(metric: ComparisonMetricKey, rows: Array<Pick<ComparisonRow, "username" | "solved" | "rating" | "ranking" | "streak">>) {
  const values = rows
    .map((row) => row[metric])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (!values.length) return null;

  return metric === "ranking" ? Math.min(...values) : Math.max(...values);
}

function metricDelta(metric: ComparisonMetricKey, value: number | null, leader: number | null) {
  if (value === null || leader === null) return null;
  if (metric === "ranking") {
    return value - leader;
  }

  return value - leader;
}

export function buildComparisonReport(inputs: ComparisonInput[]): ComparisonReport {
  const baseRows = inputs.map((input) => ({
    username: input.username,
    solved: getSolvedTotal(input.solvedStats),
    rating: getRating(input),
    ranking: getRanking(input),
    streak: getStreak(input),
  }));

  const leaders = {
    solved: bestMetricValue("solved", baseRows),
    rating: bestMetricValue("rating", baseRows),
    ranking: bestMetricValue("ranking", baseRows),
    streak: bestMetricValue("streak", baseRows),
  } as Record<ComparisonMetricKey, number | null>;

  const leaderUsers: Record<ComparisonMetricKey, string | null> = {
    solved: null,
    rating: null,
    ranking: null,
    streak: null,
  };

  (Object.keys(leaders) as ComparisonMetricKey[]).forEach((metric) => {
    const leaderValue = leaders[metric];
    if (leaderValue === null) return;
    const winner = baseRows.find((row) => row[metric] === leaderValue);
    leaderUsers[metric] = winner?.username ?? null;
  });

  const rows: ComparisonRow[] = baseRows.map((row) => {
    const deltas = {
      solved: metricDelta("solved", row.solved, leaders.solved),
      rating: metricDelta("rating", row.rating, leaders.rating),
      ranking: metricDelta("ranking", row.ranking, leaders.ranking),
      streak: metricDelta("streak", row.streak, leaders.streak),
    };

    const winnerMetrics: ComparisonMetricKey[] = (Object.keys(leaderUsers) as ComparisonMetricKey[]).filter(
      (metric) => leaderUsers[metric] === row.username,
    );

    return {
      ...row,
      deltas,
      winnerMetrics,
    };
  });

  return {
    rows,
    leaders: leaderUsers,
    metricNames: {
      solved: "Solved",
      rating: "Rating",
      ranking: "Ranking",
      streak: "Streak",
    },
  };
}
