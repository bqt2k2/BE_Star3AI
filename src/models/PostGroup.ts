import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  id: string;
  template_id: string;
  input_data: string;
  json_data: Record<string, any>;
  message: string;
  status: string;
  img_url?: string;
  request_id: string;
}

export interface IPostGroup extends Document {
  session: mongoose.Types.ObjectId;
  group_id: string;
  user: mongoose.Types.ObjectId;
  posts: IPost[];
  present: number;
  total_jobs: number;
}

const PostSchema = new Schema<IPost>(
  {
    id: String,
    template_id: String,
    input_data: String,
    json_data: Schema.Types.Mixed,
    message: String,
    status: String,
    img_url: String,
    request_id: String,
  },
  { _id: false }
);

const PostGroupSchema = new Schema<IPostGroup>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    group_id: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    posts: [PostSchema],
    present: Number,
    total_jobs: Number,
  },
  { timestamps: true }
);

export default mongoose.model<IPostGroup>("PostGroup", PostGroupSchema);
