import { getRedisClient } from "@/lib/redis";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";

export async function buildAIContext(userId: string): Promise<string> {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) return "";

  const username = (user as { leetcodeUsername?: string }).leetcodeUsername;
  if (!username) return "";

  const redis = await getRedisClient();
  const [profileRaw, skillsRaw, contestRaw] = await Promise.all([
    redis.get(`lc:${username}:profile`),
    redis.get(`lc:${username}:skills`),
    redis.get(`lc:${username}:contests`),
  ]);

  const profile = profileRaw ? JSON.parse(profileRaw) : null;
  const skills = skillsRaw ? JSON.parse(skillsRaw) : null;
  const contest = contestRaw ? JSON.parse(contestRaw) : null;

  const acStats = profile?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
  const totalSolved = acStats.find((s: any) => s.difficulty === "All")?.count || 0;
  const easySolved = acStats.find((s: any) => s.difficulty === "Easy")?.count || 0;
  const medSolved = acStats.find((s: any) => s.difficulty === "Medium")?.count || 0;
  const hardSolved = acStats.find((s: any) => s.difficulty === "Hard")?.count || 0;
  const streak = profile?.data?.matchedUser?.userCalendar?.streak || 0;
  const rating = contest?.data?.userContestRanking?.rating || "N/A";
  const rank = contest?.data?.userContestRanking?.globalRanking || "N/A";

  const allTopics = [
    ...(skills?.data?.matchedUser?.tagProblemCounts?.advanced || []),
    ...(skills?.data?.matchedUser?.tagProblemCounts?.intermediate || []),
    ...(skills?.data?.matchedUser?.tagProblemCounts?.fundamental || []),
  ].sort((a: any, b: any) => b.problemsSolved - a.problemsSolved);

  const strong = allTopics.slice(0, 4).map((t: any) => t.tagName).join(", ");
  const weak = allTopics.slice(-4).map((t: any) => t.tagName).join(", ");

  return `
USER: ${(user as { name?: string }).name || "Learner"} (@${username})
TARGET COMPANY: ${((user as { targetCompany?: string }).targetCompany) || "Not set"}
CAREER GOAL: ${((user as { careerGoal?: string }).careerGoal) || "SDE-1"}

LEETCODE STATS:
- Total Solved: ${totalSolved} (Easy: ${easySolved}, Medium: ${medSolved}, Hard: ${hardSolved})
- Current Streak: ${streak} days
- Contest Rating: ${rating}
- Global Rank: #${rank}

TOPICS:
- Strong: ${strong || "Not enough data"}
- Weak:   ${weak || "Not enough data"}
`;
}
