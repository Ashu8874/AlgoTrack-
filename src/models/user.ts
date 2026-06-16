import { Schema, model, models, type Types } from "mongoose";

export interface IFriend {
  leetcodeUsername: string;
  addedAt: Date;
}

export interface IDailyRecord {
  date: string;
  titleSlug: string;
  title: string;
  difficulty: string;
  solved: boolean;
  solveTimeMinutes?: number;
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  leetcodeUsername: string;
  avatar?: string;
  provider: "credentials" | "google" | "github";
  friends: IFriend[];
  dailyRecords: IDailyRecord[];
  createdAt: Date;
  lastLogin: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    leetcodeUsername: { type: String, default: "" },
    avatar: { type: String, default: "" },
    provider: {
      type: String,
      enum: ["credentials", "google", "github"],
      default: "credentials",
    },
    friends: [
      {
        leetcodeUsername: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    dailyRecords: [
      {
        date: { type: String, required: true },
        titleSlug: { type: String, required: true },
        title: { type: String, required: true },
        difficulty: { type: String, required: true },
        solved: { type: Boolean, default: false },
        solveTimeMinutes: { type: Number },
      },
    ],
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const User = models.User || model<IUser>("User", UserSchema);
