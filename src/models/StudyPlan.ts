import { Schema, model, models, type Types } from "mongoose";

export interface ICompletedDay {
  date: Date;
  week: number;
  day: string;
}

export interface IStudyPlan {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  targetCompany: string;
  interviewDate: Date;
  dailyHours: number;
  weakTopics: string[];
  goal: string;
  plan: Record<string, unknown>;
  completedDays: ICompletedDay[];
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    targetCompany: { type: String, required: true },
    interviewDate: { type: Date, required: true },
    dailyHours: { type: Number, required: true },
    weakTopics: [{ type: String }],
    goal: { type: String, required: true },
    plan: { type: Schema.Types.Mixed, required: true },
    completedDays: [
      {
        date: { type: Date, required: true },
        week: { type: Number, required: true },
        day: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

export const StudyPlan = models.StudyPlan || model<IStudyPlan>("StudyPlan", StudyPlanSchema);
