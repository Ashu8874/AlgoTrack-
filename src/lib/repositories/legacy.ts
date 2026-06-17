import { connectDB } from "@/lib/db";
import { User, type IUser } from "@/models/user";
import { Snapshot } from "@/models/snapshot";

export async function getUserByEmail(email: string): Promise<IUser | null> {
  try {
    await connectDB();
    return await User.findOne({ email });
  } catch (error) {
    console.error("[Repository] Get user error:", error);
    return null;
  }
}

export async function createUser(data: Partial<IUser>): Promise<IUser | null> {
  try {
    await connectDB();
    return await User.create(data);
  } catch (error) {
    console.error("[Repository] Create user error:", error);
    return null;
  }
}

export async function updateUserLastLogin(email: string): Promise<void> {
  try {
    await connectDB();
    await User.findOneAndUpdate({ email }, { lastLogin: new Date() });
  } catch (error) {
    console.error("[Repository] Update last login error:", error);
  }
}

export async function saveSnapshot(
  username: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Snapshot.findOneAndUpdate(
      { username, date: today },
      { ...data, username, date: today },
      { upsert: true },
    );
  } catch (error) {
    console.error("[Repository] Save snapshot error:", error);
  }
}

export async function getSnapshotHistory(username: string, days = 30) {
  try {
    await connectDB();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await Snapshot.find({ username, date: { $gte: startDate } })
      .sort({ date: 1 })
      .lean();

    return snapshots.map((snapshot) => ({
      date: snapshot.date instanceof Date ? snapshot.date.toISOString() : String(snapshot.date),
      totalSolved: snapshot.totalSolved,
      easySolved: snapshot.easySolved,
      mediumSolved: snapshot.mediumSolved,
      hardSolved: snapshot.hardSolved,
      rating: snapshot.rating,
      streak: snapshot.streak,
      submissionCount: snapshot.submissionCount,
    }));
  } catch (error) {
    console.error("[Repository] Get snapshot history error:", error);
    return [];
  }
}

export async function saveRoadmap(userId: string, roadmapData: Record<string, unknown>) {
  try {
    await connectDB();
    const { Roadmap } = await import("@/models/Roadmap");
    return await Roadmap.create({ userId, ...roadmapData });
  } catch (error) {
    console.error("[Repository] Save roadmap error:", error);
    return null;
  }
}

export async function getRoadmaps(userId: string) {
  try {
    await connectDB();
    const { Roadmap } = await import("@/models/Roadmap");
    return await Roadmap.find({ userId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error("[Repository] Get roadmaps error:", error);
    return [];
  }
}
