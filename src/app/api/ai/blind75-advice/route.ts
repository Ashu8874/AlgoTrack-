import { NextResponse } from 'next/server'
import { getRedisClient } from '../../../../lib/redis'
import { getAuthUser } from '../../../../lib/auth-utils'
import { generateGroqJson } from '../../../../lib/ai/client'
import type { IUser } from '../../../../models/user'

type Blind75Advice = {
  summary: string
  strengths?: string[]
  weaknesses?: string[]
  nextSteps?: Array<{ slug: string; reason: string }>
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { problems } = body || {}
    if (!problems) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const currentUser = user as unknown as IUser
    const cacheKey = `ai:blind75:${currentUser._id}`
    // Try cache
    try {
      const redis = await getRedisClient()
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json({ advice: JSON.parse(cached), cached: true })
    } catch (error) {
      console.warn('redis get failed', error)
    }

    const system: { role: 'system'; content: string } = {
      role: 'system',
      content: 'You are an expert LeetCode coach. Provide a JSON-only reply (no prose outside JSON). The JSON must include: { summary: string, strengths: string[], weaknesses: string[], nextSteps: { slug: string, reason: string }[] }',
    }

    const userMsg: { role: 'user'; content: string } = {
      role: 'user',
      content: `User Blind75 progress:\n${JSON.stringify(problems)}\nRespond only with valid JSON (no backticks).`,
    }

    const parsed = await generateGroqJson<Blind75Advice>({
      model: 'gpt-5-mini',
      messages: [system, userMsg],
      schemaName: 'blind75-advice',
      parse: (value) => {
        const data = value as Partial<Blind75Advice> & { summary?: unknown };
        return {
          summary: typeof data.summary === 'string' ? data.summary : '',
          strengths: Array.isArray(data.strengths) ? data.strengths.filter((item): item is string => typeof item === 'string') : undefined,
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses.filter((item): item is string => typeof item === 'string') : undefined,
          nextSteps: Array.isArray(data.nextSteps)
            ? data.nextSteps
                .map((item) => {
                  if (!item || typeof item !== 'object') return null;
                  const step = item as { slug?: unknown; reason?: unknown };
                  if (typeof step.slug !== 'string' || typeof step.reason !== 'string') return null;
                  return { slug: step.slug, reason: step.reason };
                })
                .filter((item): item is { slug: string; reason: string } => item !== null)
            : undefined,
        };
      },
    });

    try {
      const redis = await getRedisClient()
      await redis.set(cacheKey, JSON.stringify(parsed), 'EX', 3600)
    } catch (error) {
      console.warn('redis set failed', error)
    }

    return NextResponse.json({ advice: parsed })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
