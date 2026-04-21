import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
  dropId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  maxSize: number;
  isActive: boolean;
  lastActiveAt: Date;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    dropId: {
      type: Schema.Types.ObjectId,
      ref: "Drop",
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxSize: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IRoom>("Room", RoomSchema);