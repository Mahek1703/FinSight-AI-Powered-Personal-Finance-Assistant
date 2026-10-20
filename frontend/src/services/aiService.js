const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/ai`;
import { scanReceiptWithGemini } from "./geminiVision.service";

export const askAI = async (prompt) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "AI request failed");
    }

    return data.response;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

export const scanReceiptWithAI = async (imageFile) => {
  return scanReceiptWithGemini(imageFile);
};

export { scanReceiptWithGemini };