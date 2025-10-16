import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Schedule from "../models/Schedule";
import Post from "../models/Post";

/**
 * 🕓 Create schedule
 * POST /api/schedule/:postId
 */
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { title, description, hashtags, accountId, scheduledTime } = req.body;

    if (!accountId)
      return res.status(400).json({ message: "Missing accountId" });

    const post = await Post.findOne({ _id: postId, userId: req.user.id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    // cập nhật nội dung trước khi schedule
    if (title) post.title = title;
    if (description) post.description = description;
    if (hashtags) post.hashtags = hashtags;
    post.accountId = accountId;
    post.status = "SCHEDULED";
    post.scheduleTime = scheduledTime;
    await post.save();

    const schedule = await Schedule.create({
      userId: req.user.id,
      sessionId: post.sessionId,
      postId,
      accountId,
      scheduledTime,
    });

    res.status(201).json({ message: "Schedule created", schedule, post });
  } catch (error) {
    res.status(500).json({ message: "Create schedule failed", error });
  }
};


/**
 * ✏️ Update schedule time
 * PUT /api/schedule/:postId
 */
export const updateSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { scheduledTime } = req.body;

    const schedule = await Schedule.findOneAndUpdate(
      { postId, userId: req.user.id },
      { scheduledTime },
      { new: true }
    );

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    await Post.findByIdAndUpdate(postId, { scheduleTime: scheduledTime });

    res.json({ message: "Schedule updated", schedule });
  } catch (error) {
    res.status(500).json({ message: "Update schedule failed", error });
  }
};

/**
 * ❌ Cancel schedule
 * DELETE /api/schedule/:postId
 */
export const cancelSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const schedule = await Schedule.findOneAndDelete({
      postId,
      userId: req.user.id,
    });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    await Post.findByIdAndUpdate(postId, {
      status: "DRAFT",
      scheduleTime: null,
    });

    res.json({ message: "Schedule cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Cancel schedule failed", error });
  }
};

/**
 * 📅 Get all scheduled posts
 * GET /api/schedule
 */
export const getAllSchedules = async (req: AuthRequest, res: Response) => {
  try {
    const schedules = await Schedule.find({
      userId: req.user.id,
      status: "PENDING",
    })
      .populate("postId")
      .sort({ scheduledTime: 1 });

    res.json({ schedules });
  } catch (error) {
    res.status(500).json({ message: "Get schedule failed", error });
  }
};
