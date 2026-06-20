import { NextResponse } from 'next/server'
import redis from '../../../../lib/redis'
import { getAuthUser } from '../../../../lib/auth-utils'
import groq from '../../../../lib/ai/client'

function stripFences(text: string) {
  return text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { problems } = body || {}
    if (!problems) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const cacheKey = `ai:blind75:${(user as any)._id}`
    // Try cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json({ advice: JSON.parse(cached), cached: true })
    } catch (e) {
      console.warn('redis get failed', e)
    }

    const system = {
      role: 'system',
      content: 'You are an expert LeetCode coach. Provide a JSON-only reply (no prose outside JSON). The JSON must include: { summary: string, strengths: string[], weaknesses: string[], nextSteps: { slug: string, reason: string }[] }',
    }

    const userMsg = {
      role: 'user',
      content: `User Blind75 progress:\n${JSON.stringify(problems)}\nRespond only with valid JSON (no backticks).`,
    }

    const resp: any = await groq.chat.completions.create({ model: 'gpt-5-mini', messages: [system, userMsg], max_tokens: 800 })
    const raw = resp?.choices?.[0]?.message?.content || resp?.choices?.[0]?.text || ''
    const cleaned = stripFences(raw)

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch (e) {
      parsed = { summary: cleaned }
    }

    try {
      await redis.set(cacheKey, JSON.stringify(parsed), 'EX', 3600)
    } catch (e) {
      console.warn('redis set failed', e)
    }

    return NextResponse.json({ advice: parsed })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
