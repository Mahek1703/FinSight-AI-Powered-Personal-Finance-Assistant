import { google } from "googleapis";

/**
 * Extracts a specified header value by case-insensitive name
 */
const extractHeader = (headers = [], name) => {
  const header = headers.find(
    (item) => item.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
};

/**
 * Decodes base64url encoded email data
 */
const decodeBase64Url = (data = "") => {
  if (!data) return "";
  try {
    return Buffer.from(
      data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");
  } catch {
    return "";
  }
};

/**
 * Recursively extracts plain text / HTML body from email payload
 */
const extractEmailBody = (payload) => {
  if (!payload) return "";

  // Plain text body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // HTML body
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]*>/g, " ");
  }

  // Multipart email
  if (Array.isArray(payload.parts) && payload.parts.length > 0) {
    let combined = "";
    for (const part of payload.parts) {
      const partBody = extractEmailBody(part);
      if (partBody) {
        combined += " " + partBody;
      }
    }
    if (combined.trim()) {
      return combined;
    }
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
};

/**
 * Clean & normalize text
 */
const cleanText = (text = "") => {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&₹/gi, "₹")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Robust Amount Extractor: handles Indian Rupee (₹, INR, Rs), USD ($), and receipt patterns
 */
export const extractAmount = (text = "") => {
  if (!text) return null;

  const patterns = [
    /₹\s*([\d,]+(?:\.\d{1,2})?)/i,
    /INR\s*([\d,]+(?:\.\d{1,2})?)/i,
    /Paid\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:order\s*total|grand\s*total|total\s*amount|amount\s*paid|paid|total\s*payable|net\s*amount|total\s*price|invoice\s*amount|debited\s*by|charged|amount\s*debited)\s*[:\-]?\s*(?:₹|Rs\.?|INR|\$|EUR|GBP)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\$\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Find the first captured numeric group
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const rawNum = match[i].replace(/,/g, "").trim();
          const amount = parseFloat(rawNum);
          if (!Number.isNaN(amount) && amount > 0) {
            return amount;
          }
        }
      }
    }
  }

  return null;
};

/**
 * Standardize Date into YYYY-MM-DD
 */
export const extractDate = (text = "", emailDate = "") => {
  const datePatterns = [
    /(?:ordered|order|purchase|placed|date|bill\s*date)\s*(?:on|date)?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{4}-\d{2}-\d{2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = new Date(match[1]);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    }
  }

  if (emailDate) {
    const parsed = new Date(emailDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  return new Date().toISOString().split("T")[0];
};

/**
 * Intelligent Merchant Identifier & Category Mapper
 */
export const identifyMerchantAndCategory = (from = "", subject = "", body = "") => {
  const combined = `${from} ${subject} ${body}`.toLowerCase();

  // 1. Google Play & App Store
  if (combined.includes("google play") || combined.includes("google services") || combined.includes("google payment")) {
    return { merchant: "Google Play", category: "Entertainment" };
  }

  // 2. Netflix, Spotify, Entertainment subscriptions
  if (combined.includes("netflix")) {
    return { merchant: "Netflix", category: "Entertainment" };
  }
  if (combined.includes("spotify") || combined.includes("prime video") || combined.includes("hotstar") || combined.includes("youtube")) {
    return { merchant: "Entertainment", category: "Entertainment" };
  }

  // 3. Easebuzz, LinkedIn, Educational, Course & University fees
  if (combined.includes("easebuzz") || combined.includes("fees") || combined.includes("tuition") || combined.includes("course") || combined.includes("university") || combined.includes("academy") || combined.includes("udemy") || combined.includes("coursera")) {
    return { merchant: combined.includes("easebuzz") ? "Easebuzz" : "Education", category: "Bills/Education" };
  }
  if (combined.includes("linkedin")) {
    return { merchant: "LinkedIn", category: "Bills/Education" };
  }

  // 4. Food & Dining
  if (combined.includes("swiggy")) {
    return { merchant: "Swiggy", category: "Food" };
  }
  if (combined.includes("zomato")) {
    return { merchant: "Zomato", category: "Food" };
  }
  if (combined.includes("blinkit") || combined.includes("zepto") || combined.includes("bigbasket") || combined.includes("instamart") || combined.includes("grofers")) {
    return { merchant: "Grocery", category: "Food" };
  }

  // 5. Travel & Transit
  if (combined.includes("uber")) {
    return { merchant: "Uber", category: "Travel" };
  }
  if (combined.includes("ola")) {
    return { merchant: "Ola", category: "Travel" };
  }
  if (combined.includes("rapido") || combined.includes("makemytrip") || combined.includes("irctc") || combined.includes("indigo") || combined.includes("air india")) {
    return { merchant: "Travel", category: "Travel" };
  }

  // 6. E-Commerce Shopping
  if (combined.includes("amazon")) {
    return { merchant: "Amazon", category: "Shopping" };
  }
  if (combined.includes("flipkart")) {
    return { merchant: "Flipkart", category: "Shopping" };
  }
  if (combined.includes("myntra") || combined.includes("ajio") || combined.includes("nykaa") || combined.includes("meesho")) {
    return { merchant: "Shopping", category: "Shopping" };
  }

  // 7. General Payment Gateways
  if (combined.includes("razorpay") || combined.includes("paytm") || combined.includes("phonepe") || combined.includes("cred") || combined.includes("billdesk") || combined.includes("payment")) {
    return { merchant: "Payments", category: "Shopping" };
  }

  // 8. Fallback: domain heuristic from 'from' address
  const domainMatch = from.match(/@([a-zA-Z0-9.-]+)/);
  if (domainMatch?.[1]) {
    const rawDomain = domainMatch[1].replace(/\.(com|in|org|net|co|io)$/i, "");
    const cleanVendor = rawDomain.charAt(0).toUpperCase() + rawDomain.slice(1);
    return { merchant: cleanVendor || "Online Purchase", category: "Shopping" };
  }

  return { merchant: "Online Purchase", category: "Shopping" };
};

/**
 * Fetch and extract purchase & transaction emails via Gmail API
 *
 * @param {string} accessToken - Google OAuth Access Token
 * @returns {Promise<Array>} List of extracted financial transaction objects
 */
export const getGmailMessages = async (accessToken) => {
  if (!accessToken) {
    throw new Error("Google access token is required");
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  // 1. Broadened search query to capture all receipts, invoices, payments, and orders
  const searchQuery =
    'subject:(receipt OR order OR payment OR transaction OR "paid to" OR "successful" OR debited OR invoice OR bill OR subscription OR renewal) OR label:purchases OR from:(google.com OR easebuzz.in OR linkedin.com OR netflix.com OR amazon.in OR flipkart.com OR swiggy.in OR zomato.com OR razorpay.com OR paytm.com OR phonepe.com)';

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: searchQuery,
    maxResults: 25,
  });

  const messageList = listResponse.data.messages || [];

  if (messageList.length === 0) {
    return [];
  }

  const transactions = [];

  for (const message of messageList) {
    try {
      const response = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const payload = response.data.payload || {};
      const headers = payload.headers || [];

      const subject = extractHeader(headers, "Subject");
      const from = extractHeader(headers, "From");
      const emailDate = extractHeader(headers, "Date");

      const rawBody = extractEmailBody(payload);
      const snippet = response.data.snippet || "";
      const body = cleanText(`${snippet} ${rawBody}`);

      const combinedText = `${subject} ${body}`;

      // Extract transaction amount
      const amount = extractAmount(combinedText);

      // Ignore non-financial messages where no monetary amount was detected
      if (amount === null || amount <= 0) {
        continue;
      }

      // Identify merchant & category
      const { merchant, category } = identifyMerchantAndCategory(
        from,
        subject,
        body
      );

      // Extract transaction date
      const date = extractDate(combinedText, emailDate);

      transactions.push({
        id: `gmail_${message.id}`,
        merchant,
        vendor: merchant,
        amount,
        type: "expense",
        category,
        date,
        source: "Gmail",
        description: subject ? `${merchant}: ${subject.slice(0, 45)}` : `${merchant} purchase`,
        note: subject || `${merchant} receipt`,
        accountType: "Online",
        rawEmailId: message.id,
      });
    } catch (msgError) {
      console.error(
        `Failed to process Gmail message ID ${message.id}:`,
        msgError.message || msgError
      );
    }
  }

  return transactions;
};

export default {
  getGmailMessages,
  extractAmount,
  extractDate,
  identifyMerchantAndCategory,
};