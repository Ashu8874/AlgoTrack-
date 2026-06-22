import { NextResponse } from 'next/server'
import BLIND75 from '../../../../lib/blind75Data'
import ProblemProgress from '../../../../models/ProblemProgress'
import { getRedisClient } from '../../../../lib/redis'
import { getAuthUser } from '../../../../lib/auth-utils'
import type { IUser } from '../../../../models/user'

type ProblemProgressDoc = {
  slug: string
  solved?: boolean
  autoDetected?: boolean
}

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = user as IUser
    const username = currentUser.leetcodeUsername
    const accepted = new Set<string>()

    if (username) {
      try {
        const redis = await getRedisClient()
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
        filter: { user: currentUser._id, slug: p.slug },
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
    const rows = (await ProblemProgress.find({ user: currentUser._id }).lean()) as unknown as ProblemProgressDoc[]
    const map = new Map<string, ProblemProgressDoc>()
    for (const r of rows) map.set(r.slug, r)

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
