import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function callGroq(prompt: string): Promise<string | null> {
  try {
    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    return message.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("[Groq] Error:", error);
    return null;
  }
}

export async function generateDailyDigest(
  name: string,
  total: number,
  easy: number,
  medium: number,
  hard: number,
  rating: number,
  rank: number,
  streak: number,
  weakTopics: string
): Promise<string | null> {
  const prompt = `You are a friendly coding coach. The user's name is ${name}.
LeetCode stats: ${total} solved (${easy} Easy / ${medium} Medium / ${hard} Hard).
Contest rating: ${rating}. Global rank: ${rank}. Current streak: ${streak} days.
Weak topics this week: ${weakTopics}.
Write exactly 3 sentences. Be specific to their numbers. Mention one strength and one concrete action for today. Tone: motivational but realistic, not robotic.`;

  return await callGroq(prompt);
}

export interface InterviewReadiness {
  overallScore: number;
  byCompany: {
    google: number;
    amazon: number;
    microsoft: number;
    meta: number;
    startup: number;
  };
  strengths: string[];
  criticalGaps: string[];
  estimatedWeeksToReady: number;
  dailyRecommendation: string;
}

export async function generateInterviewReadiness(
  total: number,
  easy: number,
  medium: number,
  hard: number,
  rating: number,
  streak: number,
  strongTopics: string,
  weakTopics: string,
  avgPerDay: number
): Promise<InterviewReadiness | null> {
  const prompt = `Analyze this LeetCode profile. Return ONLY a valid JSON object, no markdown, no explanation.
{"overallScore": <0-100 integer>,
"byCompany": {"google": <0-100>, "amazon": <0-100>, "microsoft": <0-100>, "meta": <0-100>, "startup": <0-100>},
"strengths": ["...", "..."],
"criticalGaps": ["...", "..."],
"estimatedWeeksToReady": <integer>,
"dailyRecommendation": "<one actionable sentence>"}
Profile: total=${total}, easy=${easy}, medium=${medium}, hard=${hard},rating=${rating}, streak=${streak}, strongTopics=${strongTopics}, weakTopics=${weakTopics}, avgPerDay=${avgPerDay}`;

  const response = await callGroq(prompt);
  if (!response) return null;

  try {
    const json = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json);
  } catch (error) {
    console.error('[Groq] Failed to parse readiness JSON:', error);
    return null;
  }
}

export interface WeaknessTopic {
  topic: string;
  failRate: number;
  recommended: string[];
}

export interface WeaknessAnalysis {
  weakTopics: WeaknessTopic[];
  strongTopics: string[];
  focusAdvice: string;
  estimatedImprovementDays: number;
}

export async function generateWeaknessAnalysis(
  skillStats: Array<{ topic: string; total: number }>,
  failedSubmissions: Array<{ title: string; status: string }>,
): Promise<WeaknessAnalysis | null> {
  const prompt = `Analyze this user's LeetCode topic performance. Return ONLY valid JSON, no markdown.
{"weakTopics": [{ "topic": "...", "failRate": <0-100>, "recommended": ["problem1", "problem2"] }],
"strongTopics": ["...", "..."],
"focusAdvice": "<2 sentences of specific advice>",
"estimatedImprovementDays": <integer>}
Topic data: ${JSON.stringify(skillStats)}
Recent failed submissions: ${JSON.stringify(failedSubmissions)}`;

  const response = await callGroq(prompt);
  if (!response) return null;

  try {
    const json = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json);
  } catch (error) {
    console.error('[Groq] Failed to parse weakness JSON:', error);
    return null;
  }
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  weekRange: string;
  focusTopics: string[];
  dailyTarget: number;
  problems: Array<{
    title: string;
    difficulty: string;
    slug: string;
    whyImportant: string;
  }>;
  milestone: string;
  companySpecificTip: string;
}

export interface Roadmap {
  company: string;
  role: string;
  totalWeeks: number;
  phases: RoadmapPhase[];
  weeklySchedule: Record<string, string>;
  keyPatterns: string[];
}

export async function generateRoadmap(
  company: string,
  role: string,
  weeks: number
): Promise<Roadmap | null> {
  const prompt = `Generate a ${weeks}-week LeetCode interview roadmap for ${company} ${role}.
Return ONLY valid JSON, no markdown, no explanation outside JSON.
{"company": "${company}",
"role": "${role}",
"totalWeeks": ${weeks},
"phases": [{"phase": 1,"title": "...","weekRange": "Week 1–2","focusTopics": ["...", "..."],"dailyTarget": 3,"problems": [{"title": "...","difficulty": "Medium","slug": "two-sum","whyImportant": "..."}],"milestone": "...","companySpecificTip": "..."}],
"weeklySchedule": {"monday": "...", "tuesday": "...", "wednesday": "...","thursday": "...", "friday": "...", "saturday": "...", "sunday": "rest"},
"keyPatterns": ["...", "..."]}`;

  const response = await callGroq(prompt);
  if (!response) return null;

  try {
    const json = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json);
  } catch (error) {
    console.error('[Groq] Failed to parse roadmap JSON:', error);
    return null;
  }
}

export interface QueueProblem {
  title: string;
  slug: string;
  difficulty: string;
  topic: string;
  reason: string;
  estimatedMinutes: number;
}

export interface ProblemQueue {
  queue: QueueProblem[];
  totalEstimatedMinutes: number;
  focusMessage: string;
}

export async function generateProblemQueue(
  username: string,
  solvedSlugs: string[],
  weakTopics: string,
  strongTopics: string
): Promise<ProblemQueue | null> {
  const prompt = `Generate today's personalized LeetCode problem queue for this user.
Return ONLY valid JSON, no markdown.
{"queue": [{"title": "...","slug": "two-sum","difficulty": "Easy","topic": "Arrays","reason": "Warm-up — builds on your strong arrays foundation","estimatedMinutes": 15}],
"totalEstimatedMinutes": <integer>,
"focusMessage": "<one sentence about today's theme>"}
Rules: 2 Easy (warm-up) + 3 Medium (core) + 1 Hard (stretch).
Do not suggest already-solved slugs: ${solvedSlugs.slice(0, 50).join(',')}.
User's weak topics: ${weakTopics}. Strong topics: ${strongTopics}.`;

  const response = await callGroq(prompt);
  if (!response) return null;

  try {
    const json = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json);
  } catch (error) {
    console.error('[Groq] Failed to parse queue JSON:', error);
    return null;
  }
}
