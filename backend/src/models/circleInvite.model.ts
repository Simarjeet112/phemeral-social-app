import mongoose, { Schema, Document } from "mongoose";

export interface ICircleInvite extends Document {
  circleId: mongoose.Types.ObjectId;
  inviterId: mongoose.Types.ObjectId;
  inviteeId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

const CircleInviteSchema = new Schema<ICircleInvite>(
  {
    circleId: { type: Schema.Types.ObjectId, ref: "Circle", required: true },
    inviterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    inviteeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model<ICircleInvite>("CircleInvite", CircleInviteSchema);