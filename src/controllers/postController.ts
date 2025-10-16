import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Post from "../models/Post";
import PostGroup from "../models/PostGroup";
/**
 * ⚡ Post now (edit + publish)
 * POST /api/posts/:postId/now
 */
export const postNow = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { title, description, hashtags, accountId } = req.body;

    if (!accountId)
      return res.status(400).json({ message: "Missing accountId" });

    const post = await Post.findOne({ _id: postId, userId: req.user.id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (title) post.title = title;
    if (description) post.description = description;
    if (hashtags) post.hashtags = hashtags;
    post.accountId = accountId; // 🔥 Gắn account người đăng
    post.status = "POSTED";
    post.postedAt = new Date();
    post.scheduleTime = null;
    await post.save();

    res.json({ message: "✅ Posted successfully", post });
  } catch (error) {
    res.status(500).json({ message: "Post now failed", error });
  }
};
/**
 * 📄 Get all posts in a group
 * GET /api/posts/group/:groupId
 */
export const getPostsByGroupId = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // 🔍 Kiểm tra group có tồn tại không
    const group = await PostGroup.findOne({ _id: groupId, userId });
    if (!group) {
      return res.status(404).json({ message: "Group not found or unauthorized" });
    }

    // 📦 Lấy toàn bộ post thuộc group này
    const posts = await Post.find({ groupId, userId }).sort({ createdAt: -1 }).lean();

    res.json({
      message: "✅ Posts retrieved successfully",
      group,
      posts,
    });
  } catch (error: any) {
    console.error("❌ getPostsByGroupId failed:", error);
    res.status(500).json({
      message: "Get posts by group failed",
      error: error.message,
    });
  }
};