import express from "express";
import {
  genFirstSession,
  genNextPosts,
  getAllSessions,
  getSessionHistory,
} from "../controllers/sessionController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/gen-first", authMiddleware, genFirstSession);
router.post("/:sessionId/gen", authMiddleware, genNextPosts);
router.get("/", authMiddleware, getAllSessions);
router.get("/:sessionId/history", authMiddleware, getSessionHistory);

export default router;
