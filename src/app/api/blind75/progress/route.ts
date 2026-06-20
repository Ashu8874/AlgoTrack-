import { NextResponse } from 'next/server'
import BLIND75 from '../../../../lib/blind75Data'
import ProblemProgress from '../../../../models/ProblemProgress'
import redis from '../../../../lib/redis'
import { getAuthUser } from '../../../../lib/auth-utils'

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const username = (user as any).leetcodeUsername
    const accepted = new Set<string>()

    if (username && redis) {
      try {
        const key = `lc:${username}:submissions`
        const raw = await redis.get(key)
        if (raw) {
          const subs = JSON.parse(raw)
          for (const s of subs) {
            if (s.status === 'Accepted' && s.titleSlug) accepted.add(s.titleSlug)
          }
        }
      } catch (e) {
        console.warn('redis parse error', e)
      }
    }

    // Bulk upsert auto-detected progress
    const ops = BLIND75.map(p => ({
      updateOne: {
        filter: { user: (user as any)._id, slug: p.slug },
        update: { $set: { solved: accepted.has(p.slug), autoDetected: accepted.has(p.slug) } },
        upsert: true,
      },
    }))

    if (ops.length) {
      try {
        await ProblemProgress.bulkWrite(ops)
      } catch (e) {
        console.warn('bulkWrite failed', e)
      }
    }

    // Fetch current progress
    const rows = await ProblemProgress.find({ user: (user as any)._id }).lean()
    const map = new Map<string, any>()
    for (const r of rows as any[]) map.set(r.slug, r)

    const result = BLIND75.map(p => {
      const prog = map.get(p.slug)
      return {
        ...p,
        solved: prog ? !!prog.solved : false,
        autoDetected: prog ? !!prog.autoDetected : accepted.has(p.slug),
      }
    })

    return NextResponse.json({ problems: result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
