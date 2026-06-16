import { NextRequest, NextResponse } from 'next/server';
import { getRecentSubmissions, type LeetCodeSubmission } from "@/lib/leetcode";
import { getCached, setCached } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const cacheKey = `api:submissions:${username}:${limit}`;
    const cached = await getCached<LeetCodeSubmission[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    console.log('[API] Fetching submissions for:', username);
    const submissions = await getRecentSubmissions(username, limit);

    await setCached(cacheKey, submissions, 300);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('[API] Submissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
