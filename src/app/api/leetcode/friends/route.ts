import { NextResponse } from "next/server";
import { getFriendsProfiles } from "@/lib/leetcode";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { usernames?: string[] };
    const usernames = body.usernames ?? [];
    if (!usernames.length) {
      return NextResponse.json({ error: "usernames required" }, { status: 400 });
    }
    const profiles = await getFriendsProfiles(usernames.slice(0, 20));
    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch friends" },
      { status: 500 },
    );
  }
}
