import { NextResponse } from 'next/server'
import ProblemProgress from '../../../../models/ProblemProgress'
import { getAuthUser } from '../../../../lib/auth-utils'
import type { IUser } from '../../../../models/user'

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { slug, solved } = body || {}
    if (!slug || typeof solved !== 'boolean') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const currentUser = user as IUser
    const filter = { user: currentUser._id, slug }
    const update = { $set: { solved, autoDetected: false } }
    await ProblemProgress.updateOne(filter, update, { upsert: true })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
