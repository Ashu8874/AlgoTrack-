import { connectDB } from "@/lib/db";
import { Snapshot, type ISnapshot } from "@/models/snapshot";

export type CreateSnapshotInput = Omit<ISnapshot, "_id">;

export async function saveSnapshot(input: CreateSnapshotInput) {
  await connectDB();
  return Snapshot.create(input);
}

export async function getSnapshots(username: string, limit = 30) {
  await connectDB();
  return Snapshot.find({ username }).sort({ date: -1 }).limit(limit).exec();
}
