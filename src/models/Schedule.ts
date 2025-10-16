import { Schema, model, models, Document, Types } from "mongoose";

export interface ISchedule extends Document {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  postId: Types.ObjectId;
  scheduledTime: Date;
  status: "PENDING" | "POSTED" | "CANCELLED";
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },

}

const ScheduleSchema = new Schema<ISchedule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true }, // 🔥 NEW
    scheduledTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "POSTED", "CANCELLED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);


export default models.Schedule || model<ISchedule>("Schedule", ScheduleSchema);
