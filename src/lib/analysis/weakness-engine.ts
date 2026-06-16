import type { LeetCodeTopicStats } from "@/lib/leetcode";
import type { LeetCodeSolvedStats } from "@/lib/leetcode";

export type TopicCategory = "advanced" | "intermediate" | "fundamental";

export type TopicWeakness = {
  name: string;
  slug: string;
  category: TopicCategory;
  solved: number;
  shareOfTopicSolves: number;
};

export type WeaknessAnalysis = {
  weakestTopics: TopicWeakness[];
  neglectedTopics: TopicWeakness[];
  lowAttemptAreas: TopicWeakness[];
  summary: {
    topicCount: number;
    totalTopicSolves: number;
    averageSolvedPerTopic: number;
    neglectedThreshold: number;
    lowAttemptThreshold: number;
  };
};

type TopicBucket = {
  name: string;
  slug: string;
  category: TopicCategory;
  solved: number;
};

function flattenTopicStats(topicStats: LeetCodeTopicStats): TopicBucket[] {
  const matchedUser = topicStats.matchedUser;
  if (!matchedUser) return [];

  const mapBucket = (category: TopicCategory, items: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>) =>
    items.map((item) => ({
      name: item.tagName,
      slug: item.tagSlug,
      category,
      solved: item.problemsSolved,
    }));

  return [
    ...mapBucket("advanced", matchedUser.tagProblemCounts.advanced),
    ...mapBucket("intermediate", matchedUser.tagProblemCounts.intermediate),
    ...mapBucket("fundamental", matchedUser.tagProblemCounts.fundamental),
  ];
}

function toWeaknessTopics(topics: TopicBucket[]) {
  const totalTopicSolves = topics.reduce((sum, topic) => sum + topic.solved, 0);

  return topics.map<TopicWeakness>((topic) => ({
    name: topic.name,
    slug: topic.slug,
    category: topic.category,
    solved: topic.solved,
    shareOfTopicSolves: totalTopicSolves > 0 ? topic.solved / totalTopicSolves : 0,
  }));
}

export function analyzeWeaknesses(
  topicStats: LeetCodeTopicStats,
  solvedStats?: LeetCodeSolvedStats,
): WeaknessAnalysis {
  const flattenedTopics = flattenTopicStats(topicStats);
  const weaknessTopics = toWeaknessTopics(flattenedTopics);
  const sortedAscending = [...weaknessTopics].sort((left, right) => {
    if (left.solved !== right.solved) return left.solved - right.solved;
    return left.name.localeCompare(right.name);
  });

  const topicCount = weaknessTopics.length;
  const totalTopicSolves = weaknessTopics.reduce((sum, topic) => sum + topic.solved, 0);
  const averageSolvedPerTopic = topicCount > 0 ? totalTopicSolves / topicCount : 0;
  const neglectedThreshold = Math.max(2, Math.floor(averageSolvedPerTopic * 0.75));
  const lowAttemptThreshold = Math.max(1, Math.floor(averageSolvedPerTopic * 0.4));

  const weakestTopics = sortedAscending.slice(0, 3);
  const neglectedTopics = sortedAscending.filter((topic) => topic.solved <= neglectedThreshold).slice(0, 6);
  const lowAttemptAreas = sortedAscending
    .filter((topic) => topic.solved <= lowAttemptThreshold || topic.shareOfTopicSolves <= 0.05)
    .slice(0, 6);

  void solvedStats;

  return {
    weakestTopics,
    neglectedTopics,
    lowAttemptAreas,
    summary: {
      topicCount,
      totalTopicSolves,
      averageSolvedPerTopic,
      neglectedThreshold,
      lowAttemptThreshold,
    },
  };
}
