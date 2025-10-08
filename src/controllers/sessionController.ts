import { Response } from "express";
import Session from "../models/Session";
import PostGroup from "../models/PostGroup";
import { SAMPLE_POSTS } from "../utils/samplePosts";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../middleware/authMiddleware";

// POST /api/sessions -> tạo session mới
export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, platform } = req.body;
    const session = await Session.create({
      user: req.userId,
      name,
      type,
      platform,
    });
    return res.status(201).json(session);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// GET /api/sessions -> list tất cả session của user
export const listSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({ user: req.userId });
    return res.json(sessions);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// GET /api/sessions/:id -> chi tiết session
export const getSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.userId });
    if (!session) return res.status(404).json({ message: "Not found" });
    return res.json(session);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};
// helper: tạo 1 PostGroup từ templates + prompt
const generatePostGroup = async ({
  session,
  userId,
  templates,
  prompt,
}: {
  session: any;
  userId: string;
  templates: string[];
  prompt?: string;
}) => {
  const groupId = uuidv4();

  const posts = templates.map((tpl) => {
    const sample = SAMPLE_POSTS[Math.floor(Math.random() * SAMPLE_POSTS.length)];
    return {
      id: `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      template_id: tpl,
      input_data: prompt,
      json_data: sample.json_data,
      status: "Done",
      img_url: sample.img_url,
      message: "Generated from sample",
      request_id: uuidv4(),
    };
  });

  const group = await PostGroup.create({
    session: session._id,
    user: userId,
    group_id: groupId,
    posts,
    present: posts.length,
    total_jobs: posts.length,
  });

  // gắn group vào session
  session.groups = session.groups || [];
  session.groups.push(group._id);
  await session.save();

  return group;
};


// POST /api/sessions/:id/gen
export const generatePosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { prompt, templates } = req.body;
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return res.status(404).json({ message: "Session not found or not yours" });
    }

    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({ message: "templates required" });
    }

    // 1. Tạo group mới
    const group = await generatePostGroup({ session, userId, templates, prompt });

    res.status(201).json({
      message: "Posts đã được gen thêm",
      session,
      group,
      posts: group.posts,
    });
  } catch (err) {
    console.error("❌ Error generatePosts:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};
// GET /api/sessions/:id/groups -> list groups trong session của user
export const listGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await PostGroup.find({ session: req.params.id, user: req.userId });
    return res.json(groups);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// GET /api/sessions/group/:groupId -> chi tiết group
export const getGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await PostGroup.findOne({ group_id: req.params.groupId, user: req.userId });
    if (!group) return res.status(404).json({ message: "Not found" });
    return res.json(group);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};
/**
 * GET /api/sessions/:id/history
 * Trả về session + tất cả postGroups (có phân trang)
 * Query params:
 *   page (default 1), limit (default 20), sort (createdAt or -createdAt)
 */
export const getSessionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const sessionId = req.params.id;

    // verify session belongs to user
    const session = await Session.findOne({ _id: sessionId, user: userId }).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });

    // paging
    const page = Math.max(1, parseInt(req.query.page as string || "1"));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string || "20")));
    const skip = (page - 1) * limit;

    // sort
    const sortQuery: any = {};
    const sortParam = (req.query.sort as string) || "-createdAt";
    if (sortParam.startsWith("-")) {
      sortQuery[sortParam.slice(1)] = -1;
    } else {
      sortQuery[sortParam] = 1;
    }

    // query groups for this session + user
    const [total, groups] = await Promise.all([
      PostGroup.countDocuments({ session: sessionId, user: userId }),
      PostGroup.find({ session: sessionId, user: userId })
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.json({
      session,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      groups
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

/**
 * GET /api/sessions/:sessionId/groups/:groupId/posts/:postId
 * Lấy chi tiết 1 post (embedded document) trong 1 group của 1 session
 */
export const getPostDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId, groupId, postId } = req.params;

    // verify session ownership
    const session = await Session.findOne({ _id: sessionId, user: userId }).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });

    const group = await PostGroup.findOne({ group_id: groupId, session: sessionId, user: userId }).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    const post = (group.posts || []).find((p: any) => p.id === postId || p._id?.toString() === postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.json({ sessionId, groupId, post });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// Gen lần đầu: vừa tạo session vừa gen
// POST /api/sessions/gen-first
export const genFirstPost = async (req: AuthRequest, res: Response) => {
  try {
    console.log("👉 genFirstPost body:", req.body);
    const userId = req.userId!;
    const { platform, type, prompt, templates } = req.body;

    if (!platform || !type) {
      return res.status(400).json({ message: "platform và type là bắt buộc" });
    }
    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({ message: "templates required" });
    }

    // 1. Tạo session mới
    const session = await Session.create({
      user: userId,
      platform,
      type,
      name: `${platform} - ${type} - ${new Date().toLocaleString()}`,
    });

    // 2. Tạo group + posts
    const group = await generatePostGroup({ session, userId, templates, prompt });

    // ✅ Trả về đồng bộ với FE: groups thay vì group
    res.status(201).json({
      message: "Session mới + posts đã được tạo thành công",
      session,
      groups: [group],     // FE sẽ lấy genFirstResponse.data.groups
      posts: group.posts,
    });
  } catch (err) {
    console.error("❌ Error genFirstPost:", err);
    res.status(500).json({ message: "Lỗi server", error: err });
  }
};
