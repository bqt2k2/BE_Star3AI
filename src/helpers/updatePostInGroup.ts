import mongoose from "mongoose";
import PostGroup from "../models/PostGroup";

/**
 * 🛠️ Cập nhật 1 bài post trong PostGroup bằng groupId + postIndex
 */
export const updatePostInGroup = async (
  groupId: string,
  userId: string,
  postIndex: number,
  payload: Record<string, any>,
  session?: mongoose.ClientSession | null
): Promise<void> => {
  const group = await PostGroup.findOne({ _id: groupId, user: userId }).session(session || null);
  if (!group) throw new Error("Group not found");

  if (!group.posts || !group.posts[postIndex]) throw new Error("Post index not found");

  // ✅ Ép kiểu để an toàn khi merge
  const currentPost =
    typeof (group.posts[postIndex] as any).toObject === "function"
      ? (group.posts[postIndex] as any).toObject()
      : group.posts[postIndex];

  group.posts[postIndex] = { ...currentPost, ...payload } as any;

  await group.save({ session });
};
