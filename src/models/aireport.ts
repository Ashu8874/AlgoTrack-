import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type SchemaDefinition,
  type Types,
} from "mongoose";
import { createBaseSchemaOptions, optionalString, requiredString } from "./shared";

export interface AIReport {
  userId: Types.ObjectId;
  snapshotId: Types.ObjectId;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  model: string;
  promptVersion?: string;
  generatedAt: Date;
}

const aiReportSchemaDefinition: SchemaDefinition<AIReport> = {
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    index: true,
  },
  snapshotId: {
    type: Schema.Types.ObjectId,
    ref: "Snapshot",
    required: [true, "Snapshot reference is required"],
    index: true,
  },
  summary: requiredString("Summary is required"),
  strengths: {
    type: [String],
    default: [],
  },
  weaknesses: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: [String],
    default: [],
  },
  model: requiredString("Model name is required"),
  promptVersion: optionalString(),
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
};

const aiReportSchema = new Schema<AIReport>(aiReportSchemaDefinition, createBaseSchemaOptions());

aiReportSchema.index({ userId: 1, snapshotId: 1, generatedAt: -1 });

export type AIReportDocument = HydratedDocument<AIReport>;

export const AIReportModel = models.AIReport ?? model<AIReport>("AIReport", aiReportSchema);
