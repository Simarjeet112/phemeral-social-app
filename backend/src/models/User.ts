import mongoose, { Schema, Document } from "mongoose";

export interface IUser {
  username: string;
  password: string;
  createdAt: Date;
}

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    fcmToken: {
        type: String,
        default: null,
      },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
