import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type SchemaDefinition,
  type Types,
} from "mongoose";
import { createBaseSchemaOptions, optionalString, requiredString } from "./shared";

export const goalStatuses = ["active", "completed", "paused", "archived"] as const;
export type GoalStatus = (typeof goalStatuses)[number];

export interface Goal {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  status: GoalStatus;
  targetCount: number;
  currentCount: number;
  targetDate: Date;
  completedAt?: Date;
}

const goalSchemaDefinition: SchemaDefinition<Goal> = {
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    index: true,
  },
  title: requiredString("Goal title is required"),
  description: optionalString(),
  status: {
    type: String,
    enum: goalStatuses,
    default: "active",
    index: true,
  },
  targetCount: {
    type: Number,
    required: [true, "Target count is required"],
    min: [1, "Target count must be at least 1"],
  },
  currentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  targetDate: {
    type: Date,
    required: [true, "Target date is required"],
    index: true,
  },
  completedAt: {
    type: Date,
  },
};

const goalSchema = new Schema<Goal>(goalSchemaDefinition, createBaseSchemaOptions());

goalSchema.index({ userId: 1, status: 1, targetDate: 1 });

export type GoalDocument = HydratedDocument<Goal>;

export const GoalModel = models.Goal ?? model<Goal>("Goal", goalSchema);
