import { Router } from "express";
import {
  createSession,
  listSessions,
  getSession,
  generatePosts,
  listGroups,
  getGroup,
  getSessionHistory,
  getPostDetail,
  genFirstPost,          // <-- thêm vào
} from "../controllers/sessionController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Session
router.post("/", authMiddleware, createSession);
router.get("/", authMiddleware, listSessions);
router.get("/:id", authMiddleware, getSession);

// Gen lần đầu (tạo session + group + posts)
router.post("/gen-first", authMiddleware, genFirstPost);

// History: session + groups (paginated)
router.get("/:id/history", authMiddleware, getSessionHistory);

// Generate & Groups
router.post("/:id/gen", authMiddleware, generatePosts);
router.get("/:id/groups", authMiddleware, listGroups);
router.get("/group/:groupId", authMiddleware, getGroup);

// Post detail in a group
router.get("/:sessionId/groups/:groupId/posts/:postId", authMiddleware, getPostDetail);

export default router;
