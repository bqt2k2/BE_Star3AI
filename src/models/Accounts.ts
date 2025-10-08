import mongoose, { Schema, Document } from "mongoose";

export interface IAccount extends Document {
  user: mongoose.Types.ObjectId;
  provider: "facebook" | "tiktok" | "instagram";
  providerId: string; // id từ nền tảng
  name: string;
  avatar?: string;
  type: "profile" | "page";
  parentAccount?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["facebook", "tiktok", "instagram"], required: true },
    providerId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
    type: { type: String, enum: ["profile", "page"], default: "profile" },
    parentAccount: { type: Schema.Types.ObjectId, ref: "Account" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ Cho phép nhiều provider giống nhau, miễn là providerId khác
AccountSchema.index({ user: 1, providerId: 1 }, { unique: true });

export default mongoose.model<IAccount>("Account", AccountSchema);
