import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import ChatHistory from "@/models/ChatHistory";
import { StudyPlan } from "@/models/StudyPlan";
import { getGoals, getGoalProgress } from "@/lib/repositories/goal-repository";
import { getRedisClient } from "@/lib/redis";
import { getLeetCodeCacheKey } from "@/lib/leetcode/cache";
import { getDashboardData, getTopicStats, getContestInfo, getRecentSubmissions } from "@/lib/leetcode/service";
import { buildSystemPrompt, type ChatHistoryItem } from "@/lib/chatContext";
import Groq from "groq-sdk";

type LeetCodeACStat = {
  difficulty: string;
  count: number;
  submissions: number;
};

type TopicProblemCount = {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
};

type ErrorWithStatus = {
  status?: number;
  message?: string;
};

import { env } from "@/lib/env";

function getGroqClient() {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY. Set the environment variable before using the AI chat.");
  }
  return new Groq({ apiKey });
}

const MODEL = env.GROQ_MODEL || "llama-3.3-70b-versatile";

type StudyPlanContext = {
  targetCompany?: string;
  interviewDate?: Date | string;
};

function normalizeTopicList(topics: string[] | null | undefined) {
  if (!topics || topics.length === 0) return "No strong topics yet";
  return topics.join(", ");
}

function normalizeSubmissionList(submissions: Array<{ title: string; status: string; timestamp: number }> = []) {
  return submissions
    .slice(0, 5)
    .map((submission) => `• ${submission.title} (${submission.status})`)
    .join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const payload = await request.json();
    const message = String(payload.message ?? "").trim();
    const conversationHistory: ChatHistoryItem[] = Array.isArray(payload.conversationHistory)
      ? payload.conversationHistory.slice(-10)
      : [];

    if (!message) {
      return new Response(JSON.stringify({ error: "Message cannot be empty" }), { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const username = user.leetcodeUsername?.trim();
    if (!username) {
      return new Response(
        JSON.stringify({ error: "Please add your LeetCode username in settings before using the AI chat." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const redis = await getRedisClient();

    const [dashboardRaw, topicRaw, contestRaw, submissionsRaw, studyPlan] = await Promise.all([
      redis.get(getLeetCodeCacheKey("dashboard", username)),
      redis.get(getLeetCodeCacheKey("topic-stats", username)),
      redis.get(getLeetCodeCacheKey("contest-info", username)),
      redis.get(getLeetCodeCacheKey("submissions", username, "5")),
      StudyPlan.findOne({ userId: user._id }).lean<StudyPlanContext>(),
    ]);

    const dashboardData = dashboardRaw
      ? JSON.parse(dashboardRaw)
      : await getDashboardData(username);
    const topicStatsData = topicRaw
      ? JSON.parse(topicRaw)
      : await getTopicStats(username);
    const contestData = contestRaw
      ? JSON.parse(contestRaw)
      : await getContestInfo(username);
    const recentSubmissions = submissionsRaw
      ? JSON.parse(submissionsRaw)
      : await getRecentSubmissions(username, 5);

    const acStats: LeetCodeACStat[] =
      dashboardData?.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];
    const totalSolved = acStats.find((s) => s.difficulty === "All")?.count ?? 0;
    const easySolved = acStats.find((s) => s.difficulty === "Easy")?.count ?? 0;
    const mediumSolved = acStats.find((s) => s.difficulty === "Medium")?.count ?? 0;
    const hardSolved = acStats.find((s) => s.difficulty === "Hard")?.count ?? 0;
    const currentStreak = dashboardData?.matchedUser?.userCalendar?.streak ?? 0;
    const maxStreak = dashboardData?.matchedUser?.userCalendar?.totalActiveDays ?? 0;
    const contestRating = contestData?.userContestRanking?.rating ?? "N/A";
    const globalRanking = contestData?.userContestRanking?.globalRanking ?? "N/A";

    const tags: TopicProblemCount[] = [
      ...(topicStatsData?.matchedUser?.tagProblemCounts?.advanced ?? []),
      ...(topicStatsData?.matchedUser?.tagProblemCounts?.intermediate ?? []),
      ...(topicStatsData?.matchedUser?.tagProblemCounts?.fundamental ?? []),
    ];

    const sortedBySolved = tags.slice().sort((a: TopicProblemCount, b: TopicProblemCount) => a.problemsSolved - b.problemsSolved);
    const weakTopics = sortedBySolved.slice(0, 3).map((topic) => topic.tagName);
    const strongTopics = tags
      .slice()
      .sort((a: TopicProblemCount, b: TopicProblemCount) => b.problemsSolved - a.problemsSolved)
      .slice(0, 3)
      .map((topic) => topic.tagName);

    const recentText = normalizeSubmissionList(recentSubmissions);
    const goals = await getGoals(user._id);
    const activeGoal = goals.find((goal) => goal.status === "active") ?? goals[0];
    const weeklyGoal = activeGoal?.title ?? "No active weekly goal";
    const weeklyGoalProgress = activeGoal ? getGoalProgress(activeGoal) : 0;
    const targetCompany = studyPlan?.targetCompany ?? "Not set";
    const daysUntilInterview = studyPlan?.interviewDate
      ? Math.max(
          0,
          Math.ceil((new Date(studyPlan.interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        )
      : null;

    const systemPrompt = buildSystemPrompt({
      userName: user.name ?? user.email,
      username,
      targetCompany,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      currentStreak,
      maxStreak,
      contestRating,
      globalRanking,
      weakTopics,
      strongTopics,
      recentSubmissions: recentText,
      weeklyGoal,
      weeklyGoalProgress,
      daysUntilInterview,
    });

    const assistantHistory = conversationHistory.map((item) => ({
      role: item.role,
      content: item.content,
    }));

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...assistantHistory,
      { role: "user" as const, content: message },
    ];

    await ChatHistory.findOneAndUpdate(
      { userId: user._id },
      {
        $push: {
          messages: {
            role: "user",
            content: message,
            timestamp: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, new: true },
    ).exec();

    const groqClient = getGroqClient();
    const stream = await groqClient.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.75,
      max_tokens: 1024,
      stream: true,
    }) as AsyncIterable<Groq.Chat.ChatCompletionChunk>;

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk?.choices?.[0]?.delta?.content ?? "";
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          if (fullResponse) {
            await ChatHistory.findOneAndUpdate(
              { userId: user._id },
              {
                $push: {
                  messages: {
                    role: "assistant",
                    content: fullResponse,
                    timestamp: new Date(),
                  },
                },
                $set: { updatedAt: new Date() },
              },
              { upsert: true },
            ).exec();
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : JSON.stringify(error);
    const status =
      typeof (error as ErrorWithStatus)?.status === "number"
        ? (error as ErrorWithStatus).status
        : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
