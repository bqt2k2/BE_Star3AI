import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface IPost extends Document {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  groupId: Types.ObjectId;
  title: string;
  description: string;
  hashtags: string[];
  imgUrl?: string;
  scheduleTime?: Date | null;
  status: "PENDING" | "DRAFT" | "SCHEDULED" | "POSTED";
  postedAt?: Date | null;
  accountId?: Types.ObjectId | null;

}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "PostGroup", required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null }, // 🔥 NEW
    title: { type: String, required: true },
    description: { type: String, default: "" },
    hashtags: [{ type: String }],
    imgUrl: { type: String, default: "" },
    scheduleTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ["PENDING", "DRAFT", "SCHEDULED", "POSTED"],
      default: "PENDING",
    },
    postedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Post = models.Post || model<IPost>("Post", PostSchema);
export default Post;
