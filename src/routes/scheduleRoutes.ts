import express from "express";
import {
  updateSchedule,
  deleteSchedule,
  getScheduledPosts,
  createSchedule,
  postToFacebookNow,
} from "../controllers/scheduleController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.patch("/update_schedule/:post_id", authMiddleware, updateSchedule);
router.delete("/delete_schedule/:post_id", authMiddleware, deleteSchedule);
router.get("/scheduled_posts", authMiddleware, getScheduledPosts);

// 🆕 Thêm mới:
router.post("/create_schedule", authMiddleware, createSchedule);
router.post("/create_now/facebook", authMiddleware, postToFacebookNow);

export default router;
