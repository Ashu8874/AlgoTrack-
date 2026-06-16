import { Schema, model, models, type Types } from "mongoose";

export interface IMockInterview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  company: string;
  difficulty: string;
  problem: Record<string, unknown>;
  score: number;
  hintsUsed: number;
  durationSeconds: number;
  notes: string;
  feedback: string;
  completedAt: Date;
}

const MockInterviewSchema = new Schema<IMockInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true },
    difficulty: { type: String, required: true },
    problem: { type: Schema.Types.Mixed, required: true },
    score: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    feedback: { type: String, default: "" },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const MockInterview =
  models.MockInterview || model<IMockInterview>("MockInterview", MockInterviewSchema);
