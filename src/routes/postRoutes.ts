import express from "express";
import { postNow, getPostsByGroupId } from "../controllers/postController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();
router.post("/:postId/now", authMiddleware, postNow);
router.get("/group/:groupId", authMiddleware, getPostsByGroupId); // 👈 thêm dòng này
export default router;
