import { Schema, model, models, Types } from 'mongoose';

export interface IRoadmap {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  company: string;
  role: string;
  weeks: number;
  phases: Record<string, unknown>[];
  weeklySchedule: Record<string, string>;
  keyPatterns: string[];
  createdAt: Date;
}

const RoadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    weeks: { type: Number, required: true },
    phases: { type: Schema.Types.Mixed, default: [] },
    weeklySchedule: { type: Schema.Types.Mixed, default: {} },
    keyPatterns: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Roadmap = models.Roadmap || model<IRoadmap>('Roadmap', RoadmapSchema);
