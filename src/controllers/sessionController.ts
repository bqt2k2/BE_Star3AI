import { Request, Response } from "express";
import Session from "../models/Session";
import PostGroup from "../models/PostGroup";
import Post from "../models/Post";
import { AuthRequest } from "../middleware/authMiddleware";
import Template from "../models/Template";
import { generateTextContentGemini, generateImageRunware } from "../utils/ai";
import { notifyUser } from "..//app"; // ✅ import notify
import { translateToEnglish } from "../utils/translate";
import mongoose from "mongoose";
/**

 * Gộp prompt
 */
export const mixPrompt = async (templatePrompt: string, userPrompt: string) => {
  // Dịch prompt sang tiếng Anh (chỉ dùng cho sinh ảnh)
  const translatedPrompt = await translateToEnglish(userPrompt);

  const imagePrompt = `
Create an image focusing on "${translatedPrompt}".
Apply the following visual style and environment as context (do not override the subject):`;

  const textPrompt = `
Bạn là chuyên gia sáng tạo nội dung quảng cáo cao cấp.

[Concept Template]
${templatePrompt}

[Yêu cầu người dùng]
${userPrompt}

→ Viết:
1️⃣ Tiêu đề (title)
2️⃣ Mô tả ngắn (description)
3️⃣ Hashtags phù hợp
`;

  return { textPrompt, imagePrompt };
};

/**
 * ⚙️ Hàm gen async chạy ngầm
 */
export const generateAsync = async (
  sessionId: string,
  groupId: string,
  userId: string,
  prompt: string,
  templateIds: string[]
) => {
  try {
    console.log("🚀 [generateAsync] Start generating...");

    const createdPosts = [];

    // 🔁 Loop qua tất cả templateIds
    for (const templateId of templateIds) {
      const template = await Template.findById(templateId);
      if (!template) {
        console.warn(`⚠️ Template ${templateId} not found, skip`);
        continue;
      }

      const { textPrompt, imagePrompt } = await mixPrompt(template.prompt, prompt);

      console.log(`🧠 [AI] Generating text for template ${templateId}...`);
      const aiText = await generateTextContentGemini(textPrompt);
      if (!aiText) {
        console.error(`❌ AI text generation failed for ${templateId}`);
        continue;
      }

      console.log("🖼️ [AI] Generating image...");
      const imageUrl = await generateImageRunware(imagePrompt);

      // 💾 Tạo post
      const newPost = await Post.create({
        userId,
        sessionId,
        groupId,
        title: aiText.title,
        description: aiText.description,
        hashtags: aiText.hashtags || [],
        imgUrl: imageUrl,
        status: "PENDING",
      });

      createdPosts.push(newPost);
      console.log(`✅ Created post ${newPost._id} for template ${templateId}`);
    }

    // ✅ Sau khi gen đủ số lượng post
    if (createdPosts.length === templateIds.length) {
      await Session.findByIdAndUpdate(sessionId, { status: "COMPLETED" });

      const payload = {
        type: "GENERATION_COMPLETE",
        sessionId,
        groupId,
        postIds: createdPosts.map((p) => p._id),
        message: `✅ Generated ${createdPosts.length} posts successfully`,
        timestamp: new Date(),
      };

      console.log("📡 [notifyUser] Sending WS event:", payload);
      notifyUser(userId, payload);
    } else {
      // Có template lỗi → vẫn cập nhật session lỗi
      await Session.findByIdAndUpdate(sessionId, { status: "PARTIAL_FAILED" });
      notifyUser(userId, {
         type: "GENERATION_STARTED",
        sessionId,
        groupId,
        postIds: createdPosts.map((p) => p._id),
        message: "Generation started",
      });
    }

  } catch (err: any) {
    console.error("❌ [generateAsync] Error:", err);
    notifyUser(userId, {
      type: "GENERATION_ERROR",
      sessionId,
      message: err.message,
    });
    await Session.findByIdAndUpdate(sessionId, { status: "FAILED" });
  }
};


/**
 * 🧠 Gen đầu tiên - trả về ngay (async)
 */
export const genFirstSession = async (req: AuthRequest, res: Response) => {
  try {
    let { platform, type, prompt, templates } = req.body;
    const userId = req.user.id;

    // 🧩 Nếu không có templates hoặc mảng rỗng → gán template mặc định
    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      console.warn("⚠️ No templates provided — using default template.");
      templates = ["68bed97d4b5460f496021921"];
    }

    // 1️⃣ Tạo session
    const session = await Session.create({
      userId,
      platform,
      type,
      title: prompt,
      status: "PENDING",
    });

    // 2️⃣ Tạo group
    const group = await PostGroup.create({
      sessionId: session._id,
      userId,
      prompt,
      templates,
    });

    // 3️⃣ Gọi async gen
    generateAsync(session._id.toString(), group._id.toString(), userId, prompt, templates);

    return res.status(202).json({
      message: "Generation started",
      session,
      group,
    });
  } catch (error: any) {
    console.error("❌ genFirstSession failed:", error);
    res.status(500).json({ message: "genFirstSession failed", error: error.message });
  }
};


/**
 * 🧠 Gen thêm bài (async)
 */
export const genNextPosts = async (req: AuthRequest, res: Response) => {
  try {
    let { prompt, templates } = req.body;
    const { sessionId } = req.params;
    const userId = req.user.id;

    // 🧩 Nếu không có templates → fallback template mặc định
    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      console.warn("⚠️ No templates provided in next gen — using default template.");
      templates = ["68bed97d4b5460f496021921"];
    }

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Tạo group mới
    const group = await PostGroup.create({
      sessionId,
      userId,
      prompt,
      templates,
    });

    // chạy async
    generateAsync(sessionId, group._id.toString(), userId, prompt, templates);

    return res.status(202).json({
      message: "Next generation started",
      group,
    });
  } catch (error: any) {
    console.error("❌ genNextPosts failed:", error);
    res.status(500).json({ message: "genNextPosts failed", error: error.message });
  }
};
/**
 * 📋 3. Get all sessions
 */
export const getAllSessions = async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
  res.json({ sessions });
};

/**
 * 📜 4. Get session history (grouped posts)
 */
export const getSessionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).select("platform type title userId");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const groups = await PostGroup.find({ sessionId }).lean();
    const grouped = await Promise.all(
      groups.map(async (group) => {
        const posts = await Post.find({ groupId: group._id }).lean();
        return { group, posts };
      })
    );

    res.json({
      session: {
        _id: session._id,
        platform: session.platform,
        type: session.type,
        title: session.title,
      },
      grouped,
    });
  } catch (error) {
    res.status(500).json({ message: "Get session history failed", error });
  }
};
