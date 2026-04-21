import mongoose, { Document, Schema } from "mongoose";

export interface IMatchQueue extends Document {
  userId: mongoose.Types.ObjectId;
  geohash: string;
  expiresAt: Date;
  createdAt: Date;
}

const MatchQueueSchema = new Schema<IMatchQueue>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,        // one user can only be in queue once
    },
    geohash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },  // MongoDB auto deletes after 30s
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMatchQueue>("MatchQueue", MatchQueueSchema);