import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import PostGroup from "../models/PostGroup";
import { Schedule } from "../models/Schedule";

/**
 * 🕓 API 1: Tạo hoặc cập nhật lịch cho bài post
 * PATCH /api/ai/update_schedule
 */
export const updateSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { group_id, post_index, time, provider_id } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!group_id || post_index === undefined || !time || !provider_id)
      return res.status(400).json({ message: "Thiếu dữ liệu cần thiết" });

    const group = await PostGroup.findOne({ _id: group_id, user: userId });
    if (!group) return res.status(404).json({ message: "Không tìm thấy group" });

    const post = group.posts[post_index];
    if (!post) return res.status(404).json({ message: "Không tìm thấy post trong group" });

    let schedule = await Schedule.findOne({ group_id, post_index, user_id: userId });

    if (schedule) {
      schedule.time = time;
      schedule.provider_id = provider_id;
      schedule.status = "PENDING";
      schedule.content = {
        content: post.message, // ✅ đổi từ post.content → post.message
        image_url: post.img_url || "", // ✅ đổi từ post.image_url → post.img_url
      };
      await schedule.save();
    } else {
      schedule = await Schedule.create({
        group_id,
        post_index,
        user_id: userId,
        time,
        provider_id,
        status: "PENDING",
        content: {
          content: post.message, // ✅
          image_url: post.img_url || "", // ✅
        },
      });
    }

    res.status(200).json({
      message: "Post scheduled successfully",
      group_id,
      post_index,
      time: schedule.time,
      provider_id: schedule.provider_id,
      status: schedule.status,
    });
  } catch (err) {
    console.error("❌ Error updateSchedule:", err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
};

/**
 * 🗑️ API 2: Xóa lập lịch
 * DELETE /api/ai/delete_schedule
 */
export const deleteSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { group_id, post_index } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!group_id || post_index === undefined)
      return res.status(400).json({ message: "Thiếu dữ liệu cần thiết" });

    const deleted = await Schedule.findOneAndDelete({
      group_id,
      post_index,
      user_id: userId,
    });

    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy lịch để xóa" });

    res.status(200).json({
      message: "Schedule deleted successfully",
      group_id,
      post_index,
    });
  } catch (err) {
    console.error("❌ Error deleteSchedule:", err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
};

/**
 * 📋 API 3: Lấy danh sách các bài đã được lập lịch
 * GET /api/ai/scheduled_posts
 */
export const getScheduledPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const schedules = await Schedule.find({ user_id: userId }).sort({ time: -1 });
    if (!schedules.length) return res.status(200).json([]);

    const result = schedules.map((s) => ({
      post_id: `${s.group_id}_${s.post_index}`,
      group_id: s.group_id,
      post_index: s.post_index,
      user_id: s.user_id,
      content: s.content,
      time: s.time,
      provider_id: s.provider_id,
      status: s.status,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error getScheduledPosts:", err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
};

 // 🆕 API 4: Tạo lịch đăng mới
 // POST /api/ai/create_schedule
 
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { content, time, provider_id } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!content?.content || !time || !provider_id)
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu bắt buộc (content, time, provider_id)",
      });

    const schedule = await Schedule.create({
      group_id: null,
      post_index: -1,
      user_id: userId,
      content,
      time,
      provider_id,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Post scheduled successfully",
      id: schedule._id,
      time: schedule.time,
      provider_id: schedule.provider_id,
    });
  } catch (err: any) {
    console.error("❌ Error createSchedule:", err);
    res.status(500).json({
      success: false,
      message: "Error creating schedule",
      error: err.message || err,
    });
  }
};

/**
 * ⚡ API 5: Đăng ngay lên Facebook
 * POST /api/ai/create_now/facebook
 */
export const postToFacebookNow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { content, provider_id } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!content?.content || !provider_id)
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu bắt buộc (content, provider_id)",
      });

    // 🧠 Giả lập gửi bài lên Facebook (mock, chưa gọi API FB thực)
    console.log("🚀 Posting to Facebook page:", provider_id);
    console.log("📝 Content:", content);

    // ✅ Giả lập phản hồi thành công
    return res.status(200).json({
      id: `fb_post_${Date.now()}`,
      message: "Post created successfully",
    });
  } catch (err: any) {
    console.error("❌ Error postToFacebookNow:", err);
    res.status(500).json({
      success: false,
      message: "Post creation failed",
      error: err.message || err,
    });
  }
};