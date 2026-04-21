import mongoose, { Schema, Document } from "mongoose";

export interface ICircle extends Document {
  name: string;
  vibe: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  originDropId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CircleSchema = new Schema<ICircle>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    vibe: {
      type: String,
      enum: ["chill", "hype", "study", "talk", "gaming", "other"],
      default: "chill",
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    originDropId: { type: Schema.Types.ObjectId, ref: "Drop" },
  },
  { timestamps: true }
);

export default mongoose.model<ICircle>("Circle", CircleSchema);