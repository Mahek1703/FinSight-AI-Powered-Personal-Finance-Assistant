import { generateAIResponse, scanReceiptImage, parseVoiceTranscript } from "../services/gemini.service.js";

/**
 * AI Generation Route Controller
 * Handles incoming prompt requests and returns structured JSON responses without crashing Express.
 */
export const generateAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required and must be a non-empty string.",
      });
    }

    const response = await generateAIResponse(prompt.trim());

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("AI Controller Error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: error.message || "AI response generation failed.",
    });
  }
};

/**
 * AI Receipt Scanner Route Controller
 * Handles image base64 receipt/invoice uploads and returns structured transaction details
 */
export const scanReceipt = async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        success: false,
        message: "imageBase64 string is required.",
      });
    }

    const data = await scanReceiptImage(imageBase64, mimeType || "image/jpeg", prompt);

    return res.status(200).json({
      success: true,
      data,
      message: "Receipt scanned successfully with Gemini Vision AI.",
    });
  } catch (error) {
    console.error("AI Receipt Scanner Controller Error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to scan receipt image.",
    });
  }
};

/**
 * AI Voice Transcript Parser Controller
 * Parses spoken speech text (English / Hindi / Hinglish) into structured transaction JSON
 */
export const parseVoice = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: "transcript string is required.",
      });
    }

    const data = await parseVoiceTranscript(transcript.trim());

    return res.status(200).json({
      success: true,
      data,
      message: "Voice transcript parsed successfully with Gemini AI.",
    });
  } catch (error) {
    console.error("AI Voice Parser Controller Error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to parse voice transcript with Gemini AI.",
    });
  }
};

export default {
  generateAI,
  scanReceipt,
  parseVoice,
};