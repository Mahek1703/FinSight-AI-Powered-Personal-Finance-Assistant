/**
 * FinSight AI - Multilingual Voice Natural Language Parsing Engine
 * Converts spoken English / Hindi / Hinglish transcripts into structured transaction records
 * using Google Gemini 1.5 Flash API with heuristic fallback.
 */
import { apiFetch } from "./apiClient.js";

const GEMINI_VOICE_PROMPT = `You are an expert multilingual AI Financial Logging Assistant.
Extract structured financial transaction data from this spoken speech transcript in English, Hindi, or Hinglish:
Analyze the text carefully.

Return ONLY a valid JSON object with the following fields:
- amount: number (positive number. If "k", "hazaar", "sau" used, compute absolute value, e.g. "4.5k" -> 4500, "500 rupees" -> 500)
- merchant: string (name of the store, company, service or person, e.g. "Swiggy", "Uber", "Electricity Board", "Salary")
- category: string (one of ["Food", "Bills", "Shopping", "Travel", "Health", "Education", "Salary", "Investment", "Others"])
- type: string (strictly "expense" or "income")
- date: string (format YYYY-MM-DD. Handle relative terms like "yesterday", "kal", "today", "aaj" relative to current date)
- accountType: string (strictly one of ["Cash", "Online", "Bank", "Card", "Savings"])
- note: string (brief description of transaction)

Return ONLY pure JSON without markdown fences, code blocks, or extra text.`;

/**
 * Standardize category names to FinSight design system
 */
export const normalizeVoiceCategory = (rawCategory = "", rawText = "") => {
  const cat = String(rawCategory || "").toLowerCase();
  const text = String(rawText || "").toLowerCase();
  const combined = `${cat} ${text}`;

  if (
    combined.includes("swiggy") ||
    combined.includes("zomato") ||
    combined.includes("food") ||
    combined.includes("dinner") ||
    combined.includes("lunch") ||
    combined.includes("breakfast") ||
    combined.includes("khana") ||
    combined.includes("restaurant") ||
    combined.includes("cafe") ||
    combined.includes("coffee") ||
    combined.includes("starbucks") ||
    combined.includes("pizza") ||
    combined.includes("burger") ||
    combined.includes("grocer") ||
    combined.includes("blinkit") ||
    combined.includes("zepto") ||
    combined.includes("instamart") ||
    combined.includes("dhaba") ||
    combined.includes("chai")
  ) {
    return "Food";
  }

  if (
    combined.includes("bill") ||
    combined.includes("electricity") ||
    combined.includes("bijli") ||
    combined.includes("recharge") ||
    combined.includes("wifi") ||
    combined.includes("internet") ||
    combined.includes("airtel") ||
    combined.includes("jio") ||
    combined.includes("rent") ||
    combined.includes("kiraya") ||
    combined.includes("gas") ||
    combined.includes("cylinder") ||
    combined.includes("water") ||
    combined.includes("emi")
  ) {
    return "Bills";
  }

  if (
    combined.includes("uber") ||
    combined.includes("ola") ||
    combined.includes("auto") ||
    combined.includes("petrol") ||
    combined.includes("fuel") ||
    combined.includes("diesel") ||
    combined.includes("travel") ||
    combined.includes("flight") ||
    combined.includes("train") ||
    combined.includes("bus") ||
    combined.includes("metro") ||
    combined.includes("cab") ||
    combined.includes("rapido") ||
    combined.includes("toll")
  ) {
    return "Travel";
  }

  if (
    combined.includes("amazon") ||
    combined.includes("flipkart") ||
    combined.includes("myntra") ||
    combined.includes("shopping") ||
    combined.includes("clothes") ||
    combined.includes("kapde") ||
    combined.includes("shoes") ||
    combined.includes("mall") ||
    combined.includes("electronics") ||
    combined.includes("laptop") ||
    combined.includes("mobile")
  ) {
    return "Shopping";
  }

  if (
    combined.includes("health") ||
    combined.includes("doctor") ||
    combined.includes("medicine") ||
    combined.includes("dawa") ||
    combined.includes("pharmacy") ||
    combined.includes("apollo") ||
    combined.includes("hospital") ||
    combined.includes("clinic") ||
    combined.includes("gym")
  ) {
    return "Health";
  }

  if (
    combined.includes("education") ||
    combined.includes("course") ||
    combined.includes("tuition") ||
    combined.includes("fees") ||
    combined.includes("fee") ||
    combined.includes("school") ||
    combined.includes("college") ||
    combined.includes("book")
  ) {
    return "Education";
  }

  if (
    combined.includes("salary") ||
    combined.includes("bonus") ||
    combined.includes("freelance") ||
    combined.includes("wages") ||
    combined.includes("payout")
  ) {
    return "Salary";
  }

  if (
    combined.includes("invest") ||
    combined.includes("stock") ||
    combined.includes("crypto") ||
    combined.includes("sip") ||
    combined.includes("mutual fund") ||
    combined.includes("gold") ||
    combined.includes("zerodha") ||
    combined.includes("groww")
  ) {
    return "Investment";
  }

  return "Others";
};

/**
 * Standardize account type
 */
export const normalizeVoiceAccountType = (rawAccount = "", rawText = "") => {
  const combined = ` ${rawAccount} ${rawText} `.toLowerCase();
  if (combined.includes(" cash") || combined.includes("rokda") || combined.includes("nakad")) return "Cash";
  if (
    combined.includes(" bank") ||
    combined.includes("in bank") ||
    combined.includes("netbanking") ||
    combined.includes("transfer") ||
    combined.includes("neft") ||
    combined.includes("imps")
  ) {
    return "Bank";
  }
  if (combined.includes("savings")) return "Savings";
  if (
    combined.includes("credit card") ||
    combined.includes("debit card") ||
    combined.includes(" card") ||
    combined.includes("via card")
  ) {
    return "Card";
  }
  if (
    combined.includes("online") ||
    combined.includes("upi") ||
    combined.includes("gpay") ||
    combined.includes("phonepe") ||
    combined.includes("paytm")
  ) {
    return "Online";
  }
  return "Online";
};

/**
 * Clean & Parse raw JSON text from Gemini response
 */
export const sanitizeVoiceGeminiResponse = (rawText, originalTranscript = "") => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response from AI voice parser");
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  const parsed = JSON.parse(cleaned);

  // Amount extraction
  let amount = 0;
  if (typeof parsed.amount === "number") {
    amount = Math.abs(parsed.amount);
  } else if (parsed.amount || parsed.total || parsed.totalAmount) {
    const amtStr = String(parsed.amount || parsed.total || parsed.totalAmount).replace(/[₹$€, ]/g, "");
    amount = Math.abs(parseFloat(amtStr)) || 0;
  }

  // Type extraction
  const rawType = String(parsed.type || "expense").toLowerCase();
  const type = rawType.includes("income") || rawType.includes("salary") ? "Income" : "Expense";

  // Category
  const category = normalizeVoiceCategory(parsed.category || "", originalTranscript);

  // Date
  let date = String(parsed.date || new Date().toISOString().slice(0, 10)).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(date);
    date = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  }

  // Merchant / Payee
  const merchant = String(
    parsed.merchant || parsed.vendor || parsed.payee || (type === "Income" ? "Income Source" : category)
  ).trim();

  // Account Type
  const accountType = normalizeVoiceAccountType(parsed.accountType || "", originalTranscript);

  // Note
  const note = String(parsed.note || originalTranscript || `${merchant} ${type}`).trim();

  return {
    type,
    amount: Number(amount.toFixed(2)),
    category,
    merchant,
    date,
    accountType,
    note,
    rawTranscript: originalTranscript,
  };
};

/**
 * Intelligent client-side multilingual heuristic parser for Hindi/Hinglish/English
 * Fallback when offline or API token unavailable
 */
export const parseHeuristicVoice = (transcript = "") => {
  const text = String(transcript || "").trim();
  const lower = text.toLowerCase();

  // 1. Amount Extraction
  let amount = 0;

  // Check numeric pattern (e.g. ₹450, 450, 4.5k, 50k, 1,200)
  const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|hazaar|hazar)/i);
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i);
  const numMatch = lower.match(/(?:rs\.?|₹|\$|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);

  if (kMatch) {
    amount = parseFloat(kMatch[1]) * 1000;
  } else if (lakhMatch) {
    amount = parseFloat(lakhMatch[1]) * 100000;
  } else if (numMatch) {
    amount = parseFloat(numMatch[1].replace(/,/g, "")) || 0;
  } else {
    // Hindi spoken number words
    if (lower.includes("char sau") || lower.includes("chaar sau")) amount = 400;
    else if (lower.includes("panch sau") || lower.includes("paanch sau")) amount = 500;
    else if (lower.includes("ek sau") || lower.includes("sau")) amount = 100;
    else if (lower.includes("do sau")) amount = 200;
    else if (lower.includes("teen sau")) amount = 300;
    else if (lower.includes("hazaar") || lower.includes("ek hazaar")) amount = 1000;
    else if (lower.includes("do hazaar")) amount = 2000;
    else if (lower.includes("paanch hazaar")) amount = 5000;
    else if (lower.includes("dus hazaar")) amount = 10000;
    else if (lower.includes("pachas hazaar")) amount = 50000;
  }

  // 2. Type Extraction (Income vs Expense)
  const isIncome =
    lower.includes("salary") ||
    lower.includes("earned") ||
    lower.includes("received") ||
    lower.includes("credit") ||
    lower.includes("kamaya") ||
    lower.includes("aayi") ||
    lower.includes("aaye") ||
    lower.includes("mila") ||
    lower.includes("mile") ||
    lower.includes("bonus") ||
    lower.includes("freelance") ||
    lower.includes("dividend");

  const type = isIncome ? "Income" : "Expense";

  // 3. Category
  const category = isIncome
    ? lower.includes("freelance")
      ? "Freelance"
      : lower.includes("bonus")
      ? "Bonus"
      : lower.includes("invest")
      ? "Investment"
      : "Salary"
    : normalizeVoiceCategory("", text);

  // 4. Merchant Extraction
  let merchant = category;
  if (lower.includes("swiggy")) merchant = "Swiggy";
  else if (lower.includes("zomato")) merchant = "Zomato";
  else if (lower.includes("uber")) merchant = "Uber";
  else if (lower.includes("ola")) merchant = "Ola";
  else if (lower.includes("amazon")) merchant = "Amazon";
  else if (lower.includes("flipkart")) merchant = "Flipkart";
  else if (lower.includes("myntra")) merchant = "Myntra";
  else if (lower.includes("blinkit")) merchant = "Blinkit";
  else if (lower.includes("zepto")) merchant = "Zepto";
  else if (lower.includes("starbucks")) merchant = "Starbucks";
  else if (lower.includes("netflix")) merchant = "Netflix";
  else if (lower.includes("spotify")) merchant = "Spotify";
  else if (lower.includes("airtel")) merchant = "Airtel";
  else if (lower.includes("jio")) merchant = "Jio";
  else if (lower.includes("apollo")) merchant = "Apollo Pharmacy";
  else if (lower.includes("petrol") || lower.includes("fuel")) merchant = "Petrol Pump";
  else if (lower.includes("electricity") || lower.includes("bijli")) merchant = "Electricity Board";
  else if (isIncome) merchant = "Employer / Client";

  // 5. Date Resolution
  let date = new Date().toISOString().slice(0, 10);
  if (lower.includes("yesterday") || lower.includes("kal")) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().slice(0, 10);
  } else if (lower.includes("parso") || lower.includes("day before yesterday")) {
    const parso = new Date();
    parso.setDate(parso.getDate() - 2);
    date = parso.toISOString().slice(0, 10);
  }

  // 6. Account Type
  const accountType = normalizeVoiceAccountType("", text);

  return {
    type,
    amount: Number(amount.toFixed(2)),
    category,
    merchant,
    date,
    accountType,
    note: text || `${merchant} ${type}`,
    rawTranscript: text,
    isHeuristicFallback: true,
  };
};

/**
 * Parse Voice Transcript using Gemini AI with fallback cascade
 * @param {string} transcript - Speech-to-text transcript string
 * @returns {Promise<Object>} Structured transaction object
 */
export const parseVoiceWithGemini = async (transcript = "") => {
  const cleanTranscript = String(transcript || "").trim();
  if (!cleanTranscript) {
    throw new Error("Voice transcript is empty.");
  }

  // Primary: Backend Gemini Voice Proxy Call
  try {
    const backendResponse = await apiFetch("/api/ai/parse-voice", {
      method: "POST",
      body: JSON.stringify({
        transcript: cleanTranscript,
      }),
    });

    if (backendResponse.ok) {
      const backendData = await backendResponse.json();
      if (backendData.success && backendData.data) {
        const rawContent = backendData.data;
        if (typeof rawContent === "object") {
          return {
            type: String(rawContent.type || "expense").toLowerCase() === "income" ? "Income" : "Expense",
            amount: Number(rawContent.amount || 0),
            category: normalizeVoiceCategory(rawContent.category || "", cleanTranscript),
            merchant: String(rawContent.merchant || rawContent.category || "Voice Expense").trim(),
            date: rawContent.date || new Date().toISOString().slice(0, 10),
            accountType: normalizeVoiceAccountType(rawContent.accountType || "", cleanTranscript),
            note: String(rawContent.note || cleanTranscript).trim(),
            rawTranscript: cleanTranscript,
          };
        }
        return sanitizeVoiceGeminiResponse(rawContent, cleanTranscript);
      }
    }
  } catch (backendErr) {
    console.warn("Backend Gemini Voice Proxy warning:", backendErr.message || backendErr);
  }

  // Fallback: Client-side Multilingual Heuristic Parsing Cascade
  return parseHeuristicVoice(cleanTranscript);
};

export default {
  parseVoiceWithGemini,
  parseHeuristicVoice,
  normalizeVoiceCategory,
  normalizeVoiceAccountType,
  sanitizeVoiceGeminiResponse,
};
