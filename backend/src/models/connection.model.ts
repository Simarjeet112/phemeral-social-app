import mongoose, { Document, Schema } from "mongoose";

export interface IConnection extends Document {
  userA: mongoose.Types.ObjectId;
  userB: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    userA: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

// Prevent duplicate connections between same two users
ConnectionSchema.index(
  { userA: 1, userB: 1 },
  { unique: true }
);

export default mongoose.model<IConnection>("Connection", ConnectionSchema);