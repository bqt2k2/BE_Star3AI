import axios from "axios";
import crypto from "crypto";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 🖼️ Sinh ảnh bằng Runware
 */
export const generateImageRunware = async (prompt: string): Promise<string> => {
  try {
    const payload = [
      {
        taskType: "authentication",
        apiKey: process.env.RUNWARE_API_KEY,
      },
      {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        positivePrompt: prompt,
        model: "civitai:102438@133677",
        width: 512,
        height: 512,
        numberResults: 1,
      },
    ];

    const response = await axios.post("https://api.runware.ai/v1", payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data?.data;
    if (!data?.length) throw new Error("No data returned from Runware AI");

    const imageUrl = data[0].imageURL;
    console.log("✅ Generated image URL:", imageUrl);
    return imageUrl;
  } catch (err: any) {
    console.error("❌ Runware AI Error:", err.response?.data || err.message);
    return "";
  }
};

// 🧠 Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * ✍️ Sinh text content (title, description, hashtags)
 */
export async function generateTextContentGemini(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `
Viết nội dung mạng xã hội dựa trên mô tả sau:
${prompt}

Trả về JSON gồm:
{
  "title": "Tiêu đề hấp dẫn, ngắn gọn",
  "description": "Mô tả 2-3 câu sáng tạo, có yếu tố marketing",
  "hashtags": "Các hashtag cách nhau bằng dấu cách"
}
`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();
        console.log(`✅ Gemini response (attempt ${attempt}):`, text);

        try {
          const parsed = JSON.parse(text);
          return {
            title: parsed.title || "",
            description: parsed.description || "",
            hashtags: parsed.hashtags || "",
          };
        } catch {
          const title = text.match(/title[:\s"]+([^"\n]+)/i)?.[1]?.trim() || "";
          const description = text.match(/description[:\s"]+([^"\n]+)/i)?.[1]?.trim() || "";
          const hashtags = text.match(/hashtags[:\s"]+([^"\n]+)/i)?.[1]?.trim() || "";
          return { title, description, hashtags };
        }
      } catch (err: any) {
        console.error(`⚠️ Gemini attempt ${attempt} failed:`, err.message);
        if (attempt === 3) throw err;
      }
    }
  } catch (error: any) {
    console.error("❌ Gemini generateTextContentGemini error:", error);
    return { title: "", description: "", hashtags: "" };
  }
}
