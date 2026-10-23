import { generateAIResponse, scanReceiptImage, parseVoiceTranscript } from "../services/gemini.service.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_IMAGE_BASE64_LENGTH = 15 * 1024 * 1024; // ~15MB base64 characters

/**
 * AI Generation Route Controller
 * Validates prompt and executes query via Gemini service.
 */
export const generateAI = async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required and must be a non-empty string.",
      });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({
        success: false,
        error: "Prompt exceeds maximum allowed length of 10,000 characters.",
      });
    }

    const response = await generateAIResponse(prompt.trim());

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("AI Controller Error:", error.message || "Unknown error");

    return res.status(500).json({
      success: false,
      error: error.message || "AI response generation failed.",
    });
  }
};

/**
 * AI Receipt Scanner Route Controller
 * Validates base64 image data and mime type, returns structured invoice payload.
 */
export const scanReceipt = async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", prompt } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        success: false,
        error: "imageBase64 string is required.",
      });
    }

    if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      return res.status(413).json({
        success: false,
        error: "Image payload exceeds maximum allowed size (15MB).",
      });
    }

    const cleanMime = String(mimeType).toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
      return res.status(415).json({
        success: false,
        error: `Unsupported image type: ${cleanMime}. Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`,
      });
    }

    const data = await scanReceiptImage(imageBase64, cleanMime, prompt);

    return res.status(200).json({
      success: true,
      data,
      message: "Receipt scanned successfully with Gemini Vision AI.",
    });
  } catch (error) {
    console.error("AI Receipt Scanner Controller Error:", error.message || "Unknown error");

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to scan receipt image.",
    });
  }
};

/**
 * AI Voice Transcript Parser Controller
 * Parses spoken speech text into structured transaction JSON.
 */
export const parseVoice = async (req, res) => {
  try {
    const { transcript } = req.body || {};

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: "transcript string is required.",
      });
    }

    if (transcript.length > 3000) {
      return res.status(400).json({
        success: false,
        error: "Transcript exceeds maximum length of 3,000 characters.",
      });
    }

    const data = await parseVoiceTranscript(transcript.trim());

    return res.status(200).json({
      success: true,
      data,
      message: "Voice transcript parsed successfully with Gemini AI.",
    });
  } catch (error) {
    console.error("AI Voice Parser Controller Error:", error.message || "Unknown error");

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to parse voice transcript with Gemini AI.",
    });
  }
};

export default {
  generateAI,
  scanReceipt,
  parseVoice,
};