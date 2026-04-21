import mongoose, { Document, Schema } from "mongoose";

export type SignalStatus = "pending" | "accepted" | "rejected";

export interface ISignal extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  status: SignalStatus;
  expiresAt: Date;
  createdAt: Date;
}

const SignalSchema = new Schema<ISignal>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

// Prevent duplicate signals in the same room
SignalSchema.index(
  { senderId: 1, receiverId: 1, roomId: 1 },
  { unique: true }
);

export default mongoose.model<ISignal>("Signal", SignalSchema);