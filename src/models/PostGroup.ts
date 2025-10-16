import mongoose, { Schema, Document } from "mongoose";

export interface IPostGroup extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  prompt: string;
  templates: string[];
}

const PostGroupSchema = new Schema<IPostGroup>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    prompt: { type: String, required: true },
    templates: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export default mongoose.models.PostGroup ||
  mongoose.model<IPostGroup>("PostGroup", PostGroupSchema);
