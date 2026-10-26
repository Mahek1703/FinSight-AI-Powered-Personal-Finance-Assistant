/**
 * Gemini Vision OCR Service
 * Converts receipt and invoice images into structured expense transactions
 * using Google Gemini AI Vision API.
 */
import { apiFetch } from "./apiClient.js";
import {
  buildVisionAIPrompt,
  EXPENSE_CATEGORIES,
  CATEGORY_KEYWORDS,
} from "../config/constants.js";

const GEMINI_PROMPT = buildVisionAIPrompt();

/**
 * Standardize extracted category to FinSight categories
 */
export const normalizeReceiptCategory = (rawCategory = "") => {
  const cat = String(rawCategory || "").toLowerCase();
  if (cat.includes("food") || cat.includes("restaurant") || cat.includes("dining") || cat.includes("cafe") || cat.includes("swiggy") || cat.includes("zomato") || cat.includes("grocery") || cat.includes("supermarket")) {
    return "Food";
  }
  if (cat.includes("bill") || cat.includes("utility") || cat.includes("electricity") || cat.includes("water") || cat.includes("internet") || cat.includes("phone") || cat.includes("recharge")) {
    return "Bills";
  }
  if (cat.includes("shop") || cat.includes("retail") || cat.includes("amazon") || cat.includes("clothing") || cat.includes("electronics") || cat.includes("mart")) {
    return "Shopping";
  }
  if (cat.includes("travel") || cat.includes("transport") || cat.includes("fuel") || cat.includes("petrol") || cat.includes("uber") || cat.includes("ola") || cat.includes("flight") || cat.includes("train") || cat.includes("taxi")) {
    return "Travel";
  }
  if (cat.includes("health") || cat.includes("pharmacy") || cat.includes("med") || cat.includes("doctor") || cat.includes("hospital") || cat.includes("clinic")) {
    return "Health";
  }
  if (cat.includes("education") || cat.includes("course") || cat.includes("tuition") || cat.includes("book") || cat.includes("school")) {
    return "Education";
  }
  return "Others";
};

/**
 * Normalize payment type
 */
export const normalizePaymentType = (rawPayment = "") => {
  const p = String(rawPayment || "").toLowerCase();
  if (p.includes("credit")) return "Credit";
  if (p.includes("debit")) return "Debit";
  if (p.includes("cash")) return "Cash";
  if (p.includes("online") || p.includes("upi") || p.includes("card") || p.includes("bank") || p.includes("wallet") || p.includes("gpay") || p.includes("phonepe") || p.includes("paytm")) return "Online";
  return "Cash";
};

/**
 * Convert a File or Blob into base64 data string (excluding data:mime;base64, prefix)
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64Data = result.includes(",") ? result.split(",")[1] : result;
        const mimeType = file.type || "image/jpeg";
        resolve({ base64Data, mimeType, fullDataUrl: result });
      } else {
        reject(new Error("Failed to convert image to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Clean & Parse raw JSON text from Gemini response
 */
export const sanitizeAndParseGeminiResponse = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response from AI model");
  }

  // Remove markdown code fences if present (e.g. ```json ... ```)
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  // Extract json object { ... }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  const parsed = JSON.parse(cleaned);

  // Validate and sanitize fields
  const merchant = String(parsed.merchant || parsed.vendor || parsed.store || "Merchant / Store").trim();
  
  let date = String(parsed.date || new Date().toISOString().slice(0, 10)).trim();
  // Ensure YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      date = dateObj.toISOString().slice(0, 10);
    } else {
      date = new Date().toISOString().slice(0, 10);
    }
  }

  // Clean amount
  let totalAmount = 0;
  if (typeof parsed.totalAmount === "number") {
    totalAmount = Math.abs(parsed.totalAmount);
  } else if (parsed.totalAmount || parsed.amount || parsed.total) {
    const amtStr = String(parsed.totalAmount || parsed.amount || parsed.total).replace(/[\u20B9$€, ]/g, "");
    totalAmount = Math.abs(parseFloat(amtStr)) || 0;
  }

  const category = normalizeReceiptCategory(parsed.category || parsed.type || merchant);
  const paymentType = normalizePaymentType(parsed.paymentType || parsed.paymentMethod || parsed.accountType);
  const description = String(parsed.description || parsed.items || parsed.note || `${merchant} expense`).trim();

  return {
    merchant,
    date,
    totalAmount: Number(totalAmount.toFixed(2)),
    category,
    description,
    paymentType,
  };
};

/**
 * Scan receipt image using backend AI Vision service
 * @param {File|Blob} imageFile - The receipt image file
 * @returns {Promise<Object>} Structured receipt transaction details
 */
export const scanReceiptWithGemini = async (imageFile) => {
  if (!imageFile) {
    throw new Error("No receipt image file provided.");
  }

  // 1. Extract base64
  const { base64Data, mimeType, fullDataUrl } = await fileToBase64(imageFile);

  // Call Backend AI Vision OCR Proxy
  const backendResponse = await apiFetch("/api/ai/scan-receipt", {
    method: "POST",
    body: JSON.stringify({
      imageBase64: base64Data,
      mimeType: mimeType || "image/jpeg",
      prompt: GEMINI_PROMPT,
    }),
  });

  const backendData = await backendResponse.json();
  if (!backendResponse.ok || !backendData.success) {
    throw new Error(
      backendData.message || "Failed to extract expense details from the receipt."
    );
  }

  const rawContent = backendData.data || backendData.response;
  if (!rawContent) {
    throw new Error("Receipt analysis did not produce transaction data.");
  }

  const parsed =
    typeof rawContent === "object"
      ? rawContent
      : sanitizeAndParseGeminiResponse(rawContent);

  return {
    merchant: parsed.merchant || "Store Merchant",
    date: parsed.date || new Date().toISOString().slice(0, 10),
    totalAmount: Number(parsed.totalAmount || parsed.amount || 0),
    category: normalizeReceiptCategory(parsed.category),
    description: parsed.description || `${parsed.merchant || "Receipt"} expense`,
    paymentType: normalizePaymentType(parsed.paymentType),
    previewUrl: fullDataUrl,
    fileName: imageFile.name,
    fileSize: imageFile.size,
  };
};

export default {
  scanReceiptWithGemini,
  fileToBase64,
  normalizeReceiptCategory,
  normalizePaymentType,
  sanitizeAndParseGeminiResponse,
};
