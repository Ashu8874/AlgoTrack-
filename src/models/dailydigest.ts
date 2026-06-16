import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type SchemaDefinition,
  type Types,
} from "mongoose";
import { createBaseSchemaOptions, optionalString, requiredString } from "./shared";

export interface DailyDigest {
  userId: Types.ObjectId;
  date: Date;
  title: string;
  summary: string;
  highlights: string[];
  risks: string[];
  nextActions: string[];
  generatedAt: Date;
  source?: string;
}

const dailyDigestSchemaDefinition: SchemaDefinition<DailyDigest> = {
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    index: true,
  },
  date: {
    type: Date,
    required: [true, "Digest date is required"],
    index: true,
  },
  title: requiredString("Digest title is required"),
  summary: requiredString("Digest summary is required"),
  highlights: {
    type: [String],
    default: [],
  },
  risks: {
    type: [String],
    default: [],
  },
  nextActions: {
    type: [String],
    default: [],
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  source: optionalString({
    default: "daily-summary",
  }),
};

const dailyDigestSchema = new Schema<DailyDigest>(
  dailyDigestSchemaDefinition,
  createBaseSchemaOptions(),
);

dailyDigestSchema.index({ userId: 1, date: 1 }, { unique: true });

export type DailyDigestDocument = HydratedDocument<DailyDigest>;

export const DailyDigestModel =
  models.DailyDigest ?? model<DailyDigest>("DailyDigest", dailyDigestSchema);
