import { Schema, type SchemaDefinitionProperty, type Types } from "mongoose";

export type ObjectId = Types.ObjectId;

export function requiredString(
  message: string,
  options: SchemaDefinitionProperty<string> = {},
): SchemaDefinitionProperty<string> {
  return {
    type: String,
    required: [true, message] as [true, string],
    trim: true,
    ...(options as Record<string, unknown>),
  };
}

export function optionalString(
  options: SchemaDefinitionProperty<string> = {},
): SchemaDefinitionProperty<string> {
  return {
    type: String,
    trim: true,
    ...(options as Record<string, unknown>),
  };
}

export function createBaseSchemaOptions() {
  return {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown> & { _id?: Types.ObjectId; __v?: number; id?: string }) => {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  } as const;
}

export function addIdVirtual(schema: Schema) {
  schema.virtual("id").get(function id(this: { _id: Types.ObjectId }) {
    return this._id.toHexString();
  });
}
