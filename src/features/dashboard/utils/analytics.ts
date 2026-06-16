import type {
  ContestRatingPoint,
  DailySubmissionPoint,
  SolvedOverTimePoint,
} from "../components/analytics-charts";

type AnalyticsSeed = {
  totalSolved: number;
  contestRating: number | null;
  streak: number | null;
  submissionCalendar: {
    activeYears?: number[];
    submissionCalendar?: string;
  } | null;
  contestHistory?: Array<{
    rating?: number | null;
    contest?: {
      title?: string | null;
    } | null;
  }>;
};

function toReadableLabel(index: number, total: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (total - index - 1) * 7);

  return start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function parseSubmissionCalendar(
  submissionCalendar: string | undefined,
): Array<{ timestamp: number; submissions: number }> {
  if (!submissionCalendar) {
    return [];
  }

  try {
    const parsed = JSON.parse(submissionCalendar) as Record<string, number>;
    return Object.entries(parsed)
      .map(([timestamp, submissions]) => ({
        timestamp: Number(timestamp),
        submissions,
      }))
      .filter((entry) => Number.isFinite(entry.timestamp) && Number.isFinite(entry.submissions));
  } catch {
    return [];
  }
}

export function buildSolvedOverTime(seed: AnalyticsSeed): SolvedOverTimePoint[] {
  const parsedCalendar = parseSubmissionCalendar(seed.submissionCalendar?.submissionCalendar);

  if (parsedCalendar.length > 0) {
    let runningTotal = Math.max(0, seed.totalSolved - parsedCalendar.reduce((sum, entry) => sum + entry.submissions, 0));

    return parsedCalendar.slice(-10).map((entry) => {
      runningTotal += entry.submissions;
      return {
        label: new Date(entry.timestamp * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        solved: runningTotal,
      };
    });
  }

  const points = 7;
  const increment = Math.max(1, Math.floor(seed.totalSolved / points));

  return Array.from({ length: points }, (_, index) => ({
    label: toReadableLabel(index, points),
    solved: Math.min(seed.totalSolved, increment * (index + 1)),
  }));
}

export function buildContestRatingOverTime(seed: AnalyticsSeed): ContestRatingPoint[] {
  const points = 6;
  const history = seed.contestHistory?.filter((entry): entry is { rating: number | null; contest?: { title?: string | null } | null } => typeof entry.rating === "number") ?? [];

  if (history.length > 0) {
    return history.slice(-points).map((entry, index) => ({
      label: entry.contest?.title ?? `Contest ${index + 1}`,
      rating: entry.rating ?? seed.contestRating ?? 0,
    }));
  }

  const baseRating = seed.contestRating ?? 1500;
  return Array.from({ length: points }, (_, index) => ({
    label: `C${index + 1}`,
    rating: Math.max(0, baseRating - (points - index - 1) * 18 + index * 9),
  }));
}

export function buildDailySubmissionChart(seed: AnalyticsSeed): DailySubmissionPoint[] {
  const parsedCalendar = parseSubmissionCalendar(seed.submissionCalendar?.submissionCalendar);

  if (parsedCalendar.length > 0) {
    return parsedCalendar
      .slice(-14)
      .sort((left, right) => left.timestamp - right.timestamp)
      .map((entry) => ({
        label: new Date(entry.timestamp * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        submissions: entry.submissions,
      }));
  }

  const base = Math.max(1, Math.floor((seed.streak ?? 7) / 2));
  return Array.from({ length: 14 }, (_, index) => ({
    label: `D${index + 1}`,
    submissions: Math.max(0, base + ((index % 4) - 1)),
  }));
}
