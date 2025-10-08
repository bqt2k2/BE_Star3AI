import { Schema, model, Document, Types } from "mongoose";

export interface ISchedule extends Document {
  group_id: Types.ObjectId; // tham chiếu đến PostGroup
  post_index: number; // vị trí post trong mảng posts
  user_id: Types.ObjectId; // người sở hữu
  content: {
    content: string;
    image_url: string;
  };
  time: Date;
  provider_id: string;
  status: "PENDING" | "POSTED" | "FAILED";
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    group_id: { type: Schema.Types.ObjectId, ref: "PostGroup", required: true },
    post_index: { type: Number, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      content: { type: String, required: true },
      image_url: { type: String, required: true },
    },
    time: { type: Date, required: true },
    provider_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "POSTED", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const Schedule = model<ISchedule>("Schedule", ScheduleSchema);
