import mongoose, { Document, Schema } from "mongoose";

export type ReportReason =
  | "harassment"
  | "spam"
  | "inappropriate_content"
  | "other";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedId: mongoose.Types.ObjectId;
  reason: ReportReason;
  details?: string;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: ["harassment", "spam", "inappropriate_content", "other"],
      required: true,
    },
    details: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>("Report", ReportSchema);