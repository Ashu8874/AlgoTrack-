import type { Metadata } from "next";
import { getContestInfo, getSolvedStats, getSubmissionCalendar, getUserProfile } from "@/lib/leetcode";
import { buildComparisonReport } from "@/lib/analysis";
import { CompareForm } from "@/features/compare/components/compare-form";
import { ComparisonResults } from "@/features/compare/components/comparison-results";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ComparePageProps = {
  searchParams?: Promise<{ users?: string | string[] }>;
};

function parseUsers(input: string | string[] | undefined) {
  const raw = Array.isArray(input) ? input.join(",") : input ?? "";
  return raw
    .split(",")
    .map((user) => user.trim())
    .filter(Boolean);
}

function normalizeUniqueUsers(users: string[]) {
  return Array.from(new Set(users.map((user) => user.toLowerCase())));
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const params = await searchParams;
  const users = normalizeUniqueUsers(parseUsers(params?.users));
  const title = users.length ? `Compare: ${users.join(" vs ")}` : "Compare";

  return {
    title,
    description: "Compare LeetCode metrics across multiple usernames.",
  };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const users = normalizeUniqueUsers(parseUsers(params?.users));

  const comparisonInputs = await Promise.all(
    users.map(async (username) => {
      const [profile, solvedStats, contestInfo, submissionCalendar] = await Promise.all([
        getUserProfile(username),
        getSolvedStats(username),
        getContestInfo(username),
        getSubmissionCalendar(username),
      ]);

      return {
        username,
        profile,
        solvedStats,
        contestInfo,
        submissionCalendar,
      };
    }),
  );

  const report = buildComparisonReport(comparisonInputs);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <Card className="rounded-[2rem] border-border/70 bg-card/70 shadow-glow backdrop-blur">
          <CardHeader className="space-y-3">
            <Badge variant="secondary">Compare</Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">Multiple username comparison</CardTitle>
            <CardDescription>
              Compare solved problems, rating, ranking, and streak across any number of usernames.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompareForm defaultUsers={users.join(",")} />
          </CardContent>
        </Card>

        {users.length < 2 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Enter at least two usernames separated by commas to view a comparison.
            </CardContent>
          </Card>
        ) : (
          <ComparisonResults report={report} />
        )}
      </div>
    </main>
  );
}
