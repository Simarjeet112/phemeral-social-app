import mongoose, { Document, Schema } from "mongoose";

export interface IDrop extends Document {
  content: {
    text?: string;
    image?: string;
  };
  createdBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  maxSize: number;
  createdAt: Date;
}

const DropSchema = new Schema<IDrop>(
  {
    content: {
      text: { type: String },
      image: { type: String },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    maxSize: {
      type: Number,
      required: true,
      min: 2,
      max: 50,
      default: 10,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDrop>("Drop", DropSchema);