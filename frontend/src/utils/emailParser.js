import {
  collection,
  doc,
  addDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";

/**
 * Standard known vendor regex definitions and category mappings
 */
const VENDOR_CATALOG = [
  {
    name: "Amazon",
    patterns: [/amazon/i, /amzn/i, /prime\s*now/i],
    category: "Shopping",
    defaultNote: "Amazon Order",
  },
  {
    name: "Flipkart",
    patterns: [/flipkart/i, /fk\s*order/i],
    category: "Shopping",
    defaultNote: "Flipkart Order",
  },
  {
    name: "Myntra",
    patterns: [/myntra/i],
    category: "Shopping",
    defaultNote: "Myntra Fashion Order",
  },
  {
    name: "Ajio",
    patterns: [/ajio/i],
    category: "Shopping",
    defaultNote: "Ajio Order",
  },
  {
    name: "Nykaa",
    patterns: [/nykaa/i],
    category: "Shopping",
    defaultNote: "Nykaa Order",
  },
  {
    name: "Swiggy",
    patterns: [/swiggy/i, /bundl\s*technologies/i],
    category: "Food",
    defaultNote: "Swiggy Food / Instamart",
  },
  {
    name: "Zomato",
    patterns: [/zomato/i, /blinkit/i, /grofers/i],
    category: "Food",
    defaultNote: "Zomato Delivery",
  },
  {
    name: "Blinkit",
    patterns: [/blinkit/i, /grofers/i],
    category: "Food",
    defaultNote: "Blinkit Grocery",
  },
  {
    name: "Zepto",
    patterns: [/zepto/i],
    category: "Food",
    defaultNote: "Zepto Quick Delivery",
  },
  {
    name: "BigBasket",
    patterns: [/bigbasket/i, /innovative\s*retail/i],
    category: "Food",
    defaultNote: "BigBasket Grocery",
  },
  {
    name: "Uber",
    patterns: [/uber/i, /uber\s*bv/i, /uber\s*trip/i],
    category: "Travel",
    defaultNote: "Uber Ride",
  },
  {
    name: "Ola",
    patterns: [/ola\s*cabs/i, /ani\s*technologies/i, /\bola\b/i],
    category: "Travel",
    defaultNote: "Ola Ride",
  },
  {
    name: "Rapido",
    patterns: [/rapido/i, /roppen\s*transport/i],
    category: "Travel",
    defaultNote: "Rapido Ride",
  },
  {
    name: "MakeMyTrip",
    patterns: [/makemytrip/i, /mmt/i],
    category: "Travel",
    defaultNote: "MakeMyTrip Booking",
  },
  {
    name: "IRCTC",
    patterns: [/irctc/i, /indian\s*railway/i],
    category: "Travel",
    defaultNote: "Train Ticket Booking",
  },
  {
    name: "Netflix",
    patterns: [/netflix/i],
    category: "Fun",
    defaultNote: "Netflix Subscription",
  },
  {
    name: "Spotify",
    patterns: [/spotify/i],
    category: "Fun",
    defaultNote: "Spotify Subscription",
  },
  {
    name: "Apple",
    patterns: [/apple\.com/i, /itunes/i, /apple\s*services/i],
    category: "Shopping",
    defaultNote: "Apple Purchase / App Store",
  },
  {
    name: "Google Play",
    patterns: [/google\s*play/i, /google\s*payment/i],
    category: "Bills",
    defaultNote: "Google Play Transaction",
  },
  {
    name: "Electricity / Utility",
    patterns: [/electricity/i, /power\s*distribution/i, /bescom/i, /tata\s*power/i, /adani\s*electricity/i, /water\s*bill/i, /gas\s*bill/i],
    category: "Bills",
    defaultNote: "Utility Bill Payment",
  },
  {
    name: "Telecom / Broadband",
    patterns: [/airtel/i, /jio/i, /vodafone/i, /\bvi\b/i, /act\s*corp/i, /broadband/i, /fiber/i],
    category: "Bills",
    defaultNote: "Recharge / Broadband Bill",
  },
  {
    name: "Apollo Pharmacy",
    patterns: [/apollo/i, /netmeds/i, /1mg/i, /pharmeasy/i],
    category: "Health",
    defaultNote: "Pharmacy & Health",
  },
];

/**
 * Clean & normalize numeric amounts from strings with currency symbols and commas.
 */
export const cleanAmount = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : Math.abs(num);
};

/**
 * Extract currency amount from text or email HTML payload.
 */
export const extractAmountFromText = (text) => {
  if (!text || typeof text !== "string") return 0;

  // Prioritized purchase regex patterns
  const patterns = [
    /(?:order\s*total|grand\s*total|total\s*amount|amount\s*paid|paid|total\s*payable|net\s*amount|total\s*price|invoice\s*amount|debited\s*by|charged)\s*[:\-]?\s*(?:₹|Rs\.?|INR|\$|EUR|GBP)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:₹|Rs\.?|INR|\$)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = cleanAmount(match[1]);
      if (parsed > 0) return parsed;
    }
  }

  return 0;
};

/**
 * Identify vendor/merchant and appropriate category from sender, subject, or email body.
 */
export const identifyVendorAndCategory = (from = "", subject = "", body = "") => {
  const combined = `${from} ${subject} ${body}`.toLowerCase();

  for (const item of VENDOR_CATALOG) {
    for (const pattern of item.patterns) {
      if (pattern.test(combined)) {
        return {
          vendor: item.name,
          category: item.category,
          note: item.defaultNote,
        };
      }
    }
  }

  // Fallback domain extraction from 'from' header e.g. "orders@zara.com"
  const domainMatch = from.match(/@([a-zA-Z0-9.-]+)/);
  if (domainMatch?.[1]) {
    const rawDomain = domainMatch[1].replace(/\.(com|in|org|net|co|io)$/i, "");
    const cleanVendor = rawDomain.charAt(0).toUpperCase() + rawDomain.slice(1);
    return {
      vendor: cleanVendor || "Online Merchant",
      category: "Shopping",
      note: subject ? `${cleanVendor}: ${subject.slice(0, 40)}` : `${cleanVendor} Purchase`,
    };
  }

  return {
    vendor: "Online Purchase",
    category: "Shopping",
    note: subject ? subject.slice(0, 50) : "Email Purchase",
  };
};

/**
 * Parse and normalize date into standard YYYY-MM-DD ISO string.
 */
export const extractDateFromEmail = (dateHeader, text = "") => {
  if (dateHeader) {
    const parsed = new Date(dateHeader);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  // Check in-text date patterns (DD/MM/YYYY or YYYY-MM-DD)
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

  return new Date().toISOString().split("T")[0];
};

/**
 * Parse a single email or backend document payload cleanly.
 * Handles both raw Gmail payloads, HTML strings, or pre-structured JSON.
 *
 * @param {Object|string} payload - Raw email object, message payload, or API transaction object
 * @returns {Object|null} Standardized transaction object or null if invalid
 */
export const parseEmailPayload = (payload) => {
  if (!payload) return null;

  // Case 1: Payload is already structured JSON from backend API
  if (typeof payload === "object" && (payload.amount || payload.Amount)) {
    const rawAmount = payload.amount || payload.Amount;
    const amount = cleanAmount(rawAmount);

    if (amount <= 0) return null;

    const vendor =
      payload.merchant ||
      payload.vendor ||
      payload.Vendor ||
      payload.Merchant ||
      payload.source ||
      "Online Purchase";

    const { category: inferredCategory } = identifyVendorAndCategory(
      payload.from || vendor,
      payload.subject || payload.description || "",
      payload.body || ""
    );

    const category =
      payload.category ||
      payload.Category ||
      inferredCategory ||
      "Shopping";

    const date =
      payload.date ||
      payload.Date ||
      (payload.createdAt ? new Date(payload.createdAt).toISOString().split("T")[0] : null) ||
      new Date().toISOString().split("T")[0];

    const note =
      payload.description ||
      payload.note ||
      payload.Note ||
      `${vendor} order`;

    return {
      id: payload.id || `email_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount,
      vendor,
      merchant: vendor,
      category,
      type: "Expense",
      accountType: payload.accountType || payload.account || "Online",
      date,
      note,
      source: "Gmail Purchase Sync",
      rawEmailId: payload.emailId || payload.id || null,
      createdAt: new Date().toISOString(),
    };
  }

  // Case 2: Raw Gmail Message or Text Payload
  let subject = "";
  let from = "";
  let dateHeader = "";
  let bodyText = "";

  if (typeof payload === "string") {
    bodyText = payload;
  } else if (payload.headers && Array.isArray(payload.headers)) {
    const getH = (name) =>
      payload.headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
    subject = getH("Subject");
    from = getH("From");
    dateHeader = getH("Date");
    bodyText = payload.body || payload.snippet || "";
  } else {
    subject = payload.subject || payload.Subject || "";
    from = payload.from || payload.From || "";
    dateHeader = payload.date || payload.Date || "";
    bodyText = payload.body || payload.text || payload.snippet || "";
  }

  const combined = `${subject} ${bodyText}`;
  const amount = extractAmountFromText(combined);

  if (amount <= 0) {
    return null;
  }

  const { vendor, category, note: defaultNote } = identifyVendorAndCategory(from, subject, bodyText);
  const date = extractDateFromEmail(dateHeader, combined);

  return {
    id: payload.id || `email_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amount,
    vendor,
    merchant: vendor,
    category,
    type: "Expense",
    accountType: "Online",
    date,
    note: subject ? `${vendor} - ${subject.slice(0, 45)}` : defaultNote,
    source: "Gmail Purchase Sync",
    rawEmailId: payload.id || null,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Parse an array or batch of email payloads safely.
 *
 * @param {Array|Object} payloads - List of email items or API response payload
 * @returns {Array} List of clean transaction items
 */
export const parseEmailBatch = (payloads) => {
  if (!payloads) return [];

  const list = Array.isArray(payloads)
    ? payloads
    : payloads.transactions || payloads.messages || payloads.data || [payloads];

  if (!Array.isArray(list)) return [];

  const results = [];
  for (const item of list) {
    try {
      const parsed = parseEmailPayload(item);
      if (parsed && parsed.amount > 0) {
        results.push(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse email payload item:", err);
    }
  }

  return results;
};

/**
 * Safely write parsed email transactions to Firestore under `users/${auth.currentUser.uid}/transactions`
 * Triggers Firestore's `onSnapshot` real-time listener automatically.
 *
 * @param {Array|Object} transactions - One or more parsed transaction objects
 * @param {string|null} explicitUid - Optional target Firebase Auth UID
 * @returns {Promise<{ success: boolean, count: number, transactions: Array, error?: string }>}
 */
export const writeEmailTransactionsToFirestore = async (
  transactions,
  explicitUid = null
) => {
  const uid = (typeof explicitUid === "string" ? explicitUid : null) || auth.currentUser?.uid || null;
  const items = Array.isArray(transactions) ? transactions : [transactions];
  const validItems = items.filter((tx) => tx && cleanAmount(tx.amount) > 0);

  if (validItems.length === 0) {
    return { success: true, count: 0, transactions: [] };
  }

  if (!uid) {
    console.warn("User is not authenticated with Firebase. Cannot sync Gmail transactions to Firestore.");
    return {
      success: false,
      count: 0,
      transactions: [],
      error: "User is not authenticated with Firebase.",
    };
  }

  try {
    const expensesCol = collection(db, "users", uid, "expenses");

    if (validItems.length === 1) {
      const tx = validItems[0];
      const payload = {
        userId: uid,
        type: tx.type || "Expense",
        amount: cleanAmount(tx.amount),
        date: tx.date || new Date().toISOString().slice(0, 10),
        accountType: tx.accountType || "Online",
        category: tx.category || "Shopping",
        source: tx.merchant || tx.vendor || tx.category || "Gmail",
        vendor: tx.vendor || tx.merchant || "Online Purchase",
        note: tx.note || `${tx.vendor || "Online"} purchase`,
        rawEmailId: tx.rawEmailId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(expensesCol, payload);
      const savedItem = { ...payload, id: docRef.id, firestoreId: docRef.id, collection: "expenses" };
      return { success: true, count: 1, transactions: [savedItem] };
    }

    // Batch write in chunks of 400
    const CHUNK_SIZE = 400;
    const savedItems = [];

    for (let i = 0; i < validItems.length; i += CHUNK_SIZE) {
      const chunk = validItems.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const tx of chunk) {
        const docRef = doc(expensesCol);
        const payload = {
          userId: uid,
          type: tx.type || "Expense",
          amount: cleanAmount(tx.amount),
          date: tx.date || new Date().toISOString().slice(0, 10),
          accountType: tx.accountType || "Online",
          category: tx.category || "Shopping",
          source: tx.merchant || tx.vendor || tx.category || "Gmail",
          vendor: tx.vendor || tx.merchant || "Online Purchase",
          note: tx.note || `${tx.vendor || "Online"} purchase`,
          rawEmailId: tx.rawEmailId || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        batch.set(docRef, payload);
        savedItems.push({ ...payload, id: docRef.id, firestoreId: docRef.id, collection: "expenses" });
      }

      await batch.commit();
    }

    return {
      success: true,
      count: savedItems.length,
      transactions: savedItems,
    };
  } catch (error) {
    console.error("Firestore Error in writeEmailTransactionsToFirestore:", error);
    return {
      success: false,
      count: 0,
      transactions: [],
      error: error.message || String(error),
    };
  }
};

/**
 * High-level orchestration pipeline:
 * Ingests email payloads/API responses -> parses transactions -> writes safely to Firestore under `users/${uid}/transactions`
 * Real-time listener (`onSnapshot`) updates UI components seamlessly.
 *
 * @param {Array|Object} emailPayloads - Input email objects, Gmail response, or backend payload
 * @param {string|null} explicitUid - Optional target Firebase Auth UID
 */
export const processAndSyncPurchaseEmails = async (
  emailPayloads,
  explicitUid = null
) => {
  const parsed = parseEmailBatch(emailPayloads);

  if (parsed.length === 0) {
    return {
      success: true,
      count: 0,
      parsed: [],
      message: "No purchase or transaction emails found.",
    };
  }

  const syncResult = await writeEmailTransactionsToFirestore(parsed, explicitUid);

  return {
    success: syncResult.success,
    count: syncResult.count || parsed.length,
    transactions: syncResult.transactions.length > 0 ? syncResult.transactions : parsed,
    error: syncResult.error || null,
    isLocalFallback: syncResult.isLocalFallback || false,
  };
};

export default {
  cleanAmount,
  extractAmountFromText,
  identifyVendorAndCategory,
  extractDateFromEmail,
  parseEmailPayload,
  parseEmailBatch,
  writeEmailTransactionsToFirestore,
  processAndSyncPurchaseEmails,
};
