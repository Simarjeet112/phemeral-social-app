import mongoose, { Document, Schema } from "mongoose";

export interface IGhostMatch extends Document {
  userA: mongoose.Types.ObjectId;
  userB: mongoose.Types.ObjectId;
  geohash: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const GhostMatchSchema = new Schema<IGhostMatch>(
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
    geohash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },  // MongoDB auto deletes after 10 min
    },
  },
  { timestamps: true }
);

// Prevent two users from having duplicate ghost matches
GhostMatchSchema.index(
  { userA: 1, userB: 1 },
  { unique: true }
);

export default mongoose.model<IGhostMatch>("GhostMatch", GhostMatchSchema);