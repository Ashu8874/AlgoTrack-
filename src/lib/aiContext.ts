import { getRedisClient } from "@/lib/redis";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import type { IUser } from "@/models/user";

type SubmissionStat = {
  difficulty: string;
  count: number;
  submissions: number;
};

type TopicCount = {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
};

type AiContextUser = Pick<IUser, "name" | "leetcodeUsername"> & {
  targetCompany?: string;
  careerGoal?: string;
};

type LeetCodeProfileCache = {
  data?: {
    matchedUser?: {
      submitStats?: {
        acSubmissionNum?: SubmissionStat[];
      };
      userCalendar?: {
        streak?: number;
      };
    };
  };
};

type LeetCodeSkillsCache = {
  data?: {
    matchedUser?: {
      tagProblemCounts?: {
        advanced?: TopicCount[];
        intermediate?: TopicCount[];
        fundamental?: TopicCount[];
      };
    };
  };
};

type LeetCodeContestCache = {
  data?: {
    userContestRanking?: {
      rating?: number;
      globalRanking?: number;
    };
  };
};

export async function buildAIContext(userId: string): Promise<string> {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) return "";

  const aiUser = user as unknown as AiContextUser;
  const username = aiUser.leetcodeUsername;
  if (!username) return "";

  const redis = await getRedisClient();
  const [profileRaw, skillsRaw, contestRaw] = await Promise.all([
    redis.get(`lc:${username}:profile`),
    redis.get(`lc:${username}:skills`),
    redis.get(`lc:${username}:contests`),
  ]);

  const profile = profileRaw ? (JSON.parse(profileRaw) as LeetCodeProfileCache) : null;
  const skills = skillsRaw ? (JSON.parse(skillsRaw) as LeetCodeSkillsCache) : null;
  const contest = contestRaw ? (JSON.parse(contestRaw) as LeetCodeContestCache) : null;

  const acStats = profile?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
  const totalSolved = acStats.find((s) => s.difficulty === "All")?.count || 0;
  const easySolved = acStats.find((s) => s.difficulty === "Easy")?.count || 0;
  const medSolved = acStats.find((s) => s.difficulty === "Medium")?.count || 0;
  const hardSolved = acStats.find((s) => s.difficulty === "Hard")?.count || 0;
  const streak = profile?.data?.matchedUser?.userCalendar?.streak || 0;
  const rating = contest?.data?.userContestRanking?.rating || "N/A";
  const rank = contest?.data?.userContestRanking?.globalRanking || "N/A";

  const allTopics = [
    ...(skills?.data?.matchedUser?.tagProblemCounts?.advanced || []),
    ...(skills?.data?.matchedUser?.tagProblemCounts?.intermediate || []),
    ...(skills?.data?.matchedUser?.tagProblemCounts?.fundamental || []),
  ].sort((a, b) => b.problemsSolved - a.problemsSolved);

  const strong = allTopics.slice(0, 4).map((t) => t.tagName).join(", ");
  const weak = allTopics.slice(-4).map((t) => t.tagName).join(", ");

  return `
USER: ${aiUser.name || "Learner"} (@${username})
TARGET COMPANY: ${aiUser.targetCompany || "Not set"}
CAREER GOAL: ${aiUser.careerGoal || "SDE-1"}

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
