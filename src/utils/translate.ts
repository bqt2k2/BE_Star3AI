import { generateTextContentGemini } from "./ai";

export const translateToEnglish = async (text: string) => {
  try {
    const prompt = `Translate the following Vietnamese text into natural English for image generation context:
"${text}"`;
    const res = await generateTextContentGemini(prompt);
    return res?.title || text;
  } catch (e) {
    console.warn("Translation failed, fallback to Vietnamese:", e);
    return text; // fallback
  }
};
