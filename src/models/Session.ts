// src/models/Session.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  platform: string; // vd: facebook, tiktok
  type: string; // photo, video, text
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    platform: { type: String, required: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISession>("Session", sessionSchema);
