import { Schema, model, models, type Types } from "mongoose";

export interface ISnapshot {
  _id: Types.ObjectId;
  username: string;
  date: Date;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  rating: number;
  streak: number;
  submissionCount: number;
}

const SnapshotSchema = new Schema<ISnapshot>(
  {
    username: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    submissionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SnapshotSchema.index({ username: 1, date: -1 });

export const Snapshot = models.Snapshot || model<ISnapshot>('Snapshot', SnapshotSchema);
