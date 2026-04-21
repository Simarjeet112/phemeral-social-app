import mongoose, { Schema, Document } from "mongoose";

export interface ICircleMessage extends Document {
  circleId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

const CircleMessageSchema = new Schema<ICircleMessage>(
  {
    circleId: { type: Schema.Types.ObjectId, ref: "Circle", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model<ICircleMessage>("CircleMessage", CircleMessageSchema);