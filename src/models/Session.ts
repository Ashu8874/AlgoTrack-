import { Schema, model, models, type Types } from "mongoose";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  problem: string;
  problemSlug: string;
  difficulty: Difficulty;
  durationSeconds: number;
  solved: boolean;
  hintsUsed: number;
  notes: string;
  startedAt: Date;
  completedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problem: { type: String, required: true },
    problemSlug: { type: String, default: "" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    durationSeconds: { type: Number, required: true },
    solved: { type: Boolean, default: false },
    hintsUsed: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Session = models.Session || model<ISession>("Session", SessionSchema);
