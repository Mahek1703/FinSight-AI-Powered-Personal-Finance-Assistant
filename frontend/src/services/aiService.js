import { apiFetch } from "./apiClient.js";
import { scanReceiptWithGemini } from "./geminiVision.service.js";

export const askAI = async (prompt) => {
  try {
    const response = await apiFetch("/api/ai", {
      method: "POST",
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