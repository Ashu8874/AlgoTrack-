import { Schema, model, models, type Types } from "mongoose";
import type { Difficulty } from "./Session";

export type RevisionResult = "pass" | "fail";

export interface IRevisionHistory {
  date: Date;
  result: RevisionResult;
}

export interface IRevision {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  problemSlug: string;
  problemTitle: string;
  difficulty: Difficulty;
  nextReviewDate: Date;
  interval: number;
  repetitions: number;
  easeFactor: number;
  history: IRevisionHistory[];
}

const RevisionSchema = new Schema<IRevision>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problemSlug: { type: String, required: true },
    problemTitle: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    nextReviewDate: { type: Date, required: true, index: true },
    interval: { type: Number, default: 1 },
    repetitions: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    history: [
      {
        date: { type: Date, required: true },
        result: { type: String, enum: ["pass", "fail"], required: true },
      },
    ],
  },
  { timestamps: true },
);

RevisionSchema.index({ userId: 1, problemSlug: 1 }, { unique: true });

export const Revision = models.Revision || model<IRevision>("Revision", RevisionSchema);
