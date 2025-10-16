import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  platform: string;
  type: string;
  status: "PENDING"|"CREATED" | "GENERATED" | "DONE";
  title: string; // prompt đầu tiên
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    platform: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
  enum: ["PENDING", "GENERATING", "GENERATED", "FAILED"],
  default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Session ||
  mongoose.model<ISession>("Session", SessionSchema);
