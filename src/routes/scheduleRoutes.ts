import express from "express";
import {
  createSchedule,
  updateSchedule,
  cancelSchedule,
  getAllSchedules,
} from "../controllers/scheduleController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/:postId", authMiddleware, createSchedule);
router.put("/:postId", authMiddleware, updateSchedule);
router.delete("/:postId", authMiddleware, cancelSchedule);
router.get("/", authMiddleware, getAllSchedules);

export default router;
