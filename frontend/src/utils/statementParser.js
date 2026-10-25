import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

import { MAX_FILE_SIZE_BYTES } from "../config/constants.js";

export { MAX_FILE_SIZE_BYTES };

/** Strictly supported document extensions */
export const ALLOWED_EXTENSIONS = ["pdf", "csv", "xlsx", "xls", "txt"];

/** Explicitly prohibited image extensions */
export const DISALLOWED_IMAGE_EXTENSIONS = [
  "png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "tiff", "ico", "heic", "avif"
];

/**
 * 1. File Validation Engine
 * Validates file format strictly to .pdf, .csv, .xlsx, .xls, .txt and enforces 10MB limit.
 */
export const validateStatementFile = (file) => {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const name = file.name || "";
  const extension = name.slice(((name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();

  // Explicitly check and block image formats
  if (DISALLOWED_IMAGE_EXTENSIONS.includes(extension) || file.type?.startsWith("image/")) {
    return {
      valid: false,
      error: "Image files are not supported for statement ingestion. Please upload a .pdf, .csv, .xlsx, or .xls statement.",
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type (.${extension || "unknown"}). Allowed formats: .pdf, .csv, .xlsx, .xls`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds the 10MB limit. Please upload a smaller document.`,
    };
  }

  return { valid: true, extension };
};

/**
 * 2. Amount Matcher Engine
 * Automatically converts raw string amounts to clean positive numbers.
 */
export const cleanAmount = (raw) => {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return Math.abs(raw);

  let str = String(raw).trim();

  // Accounting negative notation: "(1,250.00)"
  if (str.startsWith("(") && str.endsWith(")")) {
    str = str.slice(1, -1);
  }

  // Remove currency symbols, commas, +, -, Dr, Cr, whitespace
  const cleaned = str.replace(/[\u20B9$€£¥INR|Rs.?|,|\s|+|Dr|Cr|dr|cr|-]/gi, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : Math.abs(num);
};

/**
 * 3. Type Detector Engine
 * Determines Expense vs Income based on amount signs, Dr/Cr indicators, or narration keywords.
 */
export const detectTransactionType = ({
  amountRaw = "",
  narration = "",
  typeColumn = "",
  debitAmount = null,
  creditAmount = null,
}) => {
  // If distinct Debit / Credit columns exist
  if (debitAmount !== null && Number(debitAmount) > 0) return "Expense";
  if (creditAmount !== null && Number(creditAmount) > 0) return "Income";

  // If explicit type column given
  const typeStr = String(typeColumn || "").toLowerCase().trim();
  if (["credit", "cr", "income", "deposit", "c", "received", "credited"].includes(typeStr)) return "Income";
  if (["debit", "dr", "expense", "payment", "withdrawal", "d", "paid", "debited"].includes(typeStr)) return "Expense";

  // Amount sign analysis
  const amtStr = String(amountRaw || "").trim();
  if (amtStr.startsWith("+")) return "Income";
  if (amtStr.startsWith("-") || (amtStr.startsWith("(") && amtStr.endsWith(")"))) return "Expense";
  if (/\b(?:cr|credit)\b/i.test(amtStr)) return "Income";
  if (/\b(?:dr|debit)\b/i.test(amtStr)) return "Expense";

  // Narration keyword analysis
  const text = String(narration || "").toLowerCase();
  const incomeRegex = /\b(salary|credit(?:ed)?|deposit(?:ed)?|cashback|refund(?:ed)?|dividend|interest|reversal|received\s+from|upi\/cr|imps\s+cr|neft\s+cr|inflow|credited|earned)\b/i;
  const expenseRegex = /\b(debit(?:ed)?|payment|paid\s+to|transfer\s+to|purchase|spent|withdrawal|upi\/dr|imps\s+dr|neft\s+dr|pos\b|outflow|debited|billdesk)\b/i;

  if (incomeRegex.test(text) && !expenseRegex.test(text)) {
    return "Income";
  }
  if (expenseRegex.test(text)) {
    return "Expense";
  }

  // Default fallback
  return "Expense";
};

/**
 * 4. Narration Cleaner Engine
 * Cleans messy merchant strings (e.g., "UPI-SWIGGY-128937" -> "Swiggy").
 */
export const cleanNarration = (raw) => {
  if (!raw) return "General Transaction";
  let str = String(raw).trim();

  // Strip banking protocol & rail prefixes
  str = str.replace(
    /\b(?:UPI|POS|NEFT|RTGS|IMPS|ACH|NACH|CMS|INB|MB|BILLDESK|RAZORPAY|PAYTM|EPAY|CC|TPV|PURCHASE|SETTLEMENT|DIRECT\s+DEBIT)[-/\s:]+/gi,
    " "
  );

  // Strip long numeric IDs, UTRs, reference strings, and account numbers
  str = str.replace(/\b\d{6,}\b/g, ""); // 6+ digit codes
  str = str.replace(/\b[A-Z0-9]{10,}\b/g, ""); // 10+ alphanumeric hash codes
  str = str.replace(/@[a-zA-Z0-9.]+/g, ""); // UPI handles (@okaxis, @paytm, etc.)
  str = str.replace(/\b(?:ref|rrn|txn|utr|id|no|chq|cheque|vpa)[:\s#]*[a-zA-Z0-9_-]+/gi, "");
  str = str.replace(/\b(?:dr|cr|bal|avl\s*bal|closing\s*bal|to|from)[:\s0-9.,]*/gi, " ");

  // Strip symbols & delimiters
  str = str.replace(/[_/\-*:]+/g, " ");

  // Collapse whitespace
  str = str.replace(/\s+/g, " ").trim();

  if (!str || str.length < 2) {
    return "Transaction";
  }

  // Format into clean Title Case
  str = str
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 1) return word.toUpperCase();
      if (word.toUpperCase() === word || word.toLowerCase() === word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(" ");

  return str || "Transaction";
};

/**
 * 5. Auto-Categorization Engine
 * Applies keyword matching:
 * - "Food" (Swiggy, Zomato, etc.)
 * - "Travel" (Uber, Ola, Fuel, etc.)
 * - "Shopping" (Amazon, Clothes, etc.)
 * - "Health" (Doctor, Pharmacy, etc.)
 * - "Salary" (Salary, Credit, etc.)
 * - "Bills" (WiFi, Electricity, etc.)
 * - Default -> Shopping
 */
export const autoCategorize = (cleanNote, rawNarration = "", type = "Expense") => {
  const text = `${cleanNote} ${rawNarration}`.toLowerCase();
  const isIncome = (type || "").toLowerCase() === "income";

  if (isIncome) {
    if (/salary|payroll|stipend|wages|employer|direct\s*dep/i.test(text)) return "Salary";
    if (/dividend|interest|stock|mutual\s*fund|trading|zerodha|groww|upstox|shares/i.test(text)) return "Investment";
    if (/freelance|consult|upwork|fiverr|client|contract|invoice/i.test(text)) return "Freelance";
    if (/bonus|reward|cashback|points/i.test(text)) return "Bonus";
    return "Salary";
  }

  // 1. Food (Swiggy / Zomato / Blinkit / Restaurants / Food keywords)
  if (
    /swiggy|zomato|blinkit|zepto|instamart|starbucks|mcdonald|kfc|domino|burger|pizza|restaurant|dining|cafe|coffee|eatclub|eats|bakery|grocer|food|kitchen|biryani|subway|chai/i.test(
      text
    )
  ) {
    return "Food";
  }

  // 2. Travel (Uber / Ola / Fuel / Flights / Transit / Travel keywords)
  if (
    /uber|ola|fuel|petrol|diesel|indian\s*oil|hpcl|bpcl|metro|irctc|flight|indigo|air\s*india|makemytrip|goibibo|rapido|fastag|toll|parking|yulu|travel|cab|auto|bus|train/i.test(
      text
    )
  ) {
    return "Travel";
  }

  // 3. Health & Medical
  if (
    /hospital|pharmacy|apollo|1mg|medplus|pharmeasy|doctor|clinic|health|dentist|diagnostic|lab|medical|netmeds|curefit|gym|fitness/i.test(
      text
    )
  ) {
    return "Health";
  }

  // 4. Bills & Utilities
  if (
    /electric|power|water|gas|broadband|wifi|airtel|jio|vi\b|vodafone|bescom|tneb|bill|recharge|dth|tata\s*play|lic|insurance|rent|maintenance|utility|postpaid/i.test(
      text
    )
  ) {
    return "Bills";
  }

  // 5. Entertainment & Fun
  if (
    /netflix|spotify|prime|hotstar|bookmyshow|cinema|pvr|inox|movie|gaming|steam|playstation|youtube|disney|fun/i.test(
      text
    )
  ) {
    return "Fun";
  }

  // 6. Education
  if (/udemy|coursera|school|college|university|exam|tuition|book|course|edx/i.test(text)) {
    return "Education";
  }

  // 7. Investment
  if (/zerodha|groww|upstox|mutual\s*fund|sip|kuvera|coin|indmoney|angelone/i.test(text)) {
    return "Investment";
  }

  // 8. Shopping & E-Commerce (Amazon, Clothes, Retail, Shopping keywords)
  if (
    /amazon|flipkart|myntra|ajio|zara|h&m|nykaa|meesho|tata\s*cliq|decathlon|croma|reliance|retail|store|mall|cloth|fashion|shopping/i.test(
      text
    )
  ) {
    return "Shopping";
  }

  // Default fallback -> Shopping
  return "Shopping";
};

/**
 * Standardize dates to YYYY-MM-DD
 */
export const normalizeDate = (raw) => {
  if (!raw) return new Date().toISOString().slice(0, 10);

  // Handle Excel numerical date serials (e.g. 45123)
  if (typeof raw === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + raw * 86400000);
    if (!Number.isNaN(jsDate.getTime())) {
      return jsDate.toISOString().slice(0, 10);
    }
  }

  const str = String(raw).trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Format: YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Format: "15 Jan 2026", "15-Aug-2025"
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
};

/**
 * Parses a single text line into a structured transaction
 * Extracts:
 * - Category: Matches "Food", "Travel", "Shopping", "Health", "Salary", etc.
 * - Amount: Parses numeric digits using regex (/(\d+(\.\d+)?)/)
 * - Type: Default "Expense" unless specified as credit/income
 * - Date: Extracted date or fallback timestamp
 */
export const parseLineToTransaction = (line, fallbackDate = null) => {
  if (!line || typeof line !== "string") return null;
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // 1. Extract Amount using regex: captures numbers with optional commas/decimals
  const amountMatch = trimmed.match(/(?:rs\.?|[\u20B9]|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
  if (!amountMatch) return null;

  const rawAmtStr = amountMatch[1] || amountMatch[0];
  const amount = cleanAmount(rawAmtStr);
  if (amount <= 0) return null;

  // 2. Extract Date (optional)
  const dateRegex = /\b(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{2,4}|\d{4}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{1,2})\b/;
  const dateMatch = trimmed.match(dateRegex);
  const finalDate = dateMatch
    ? normalizeDate(dateMatch[0])
    : (fallbackDate || new Date().toISOString().slice(0, 10));

  // 3. Extract Narration string by stripping date and amount from the line
  let rawNarration = trimmed;
  if (dateMatch) {
    rawNarration = rawNarration.replace(dateMatch[0], " ");
  }
  rawNarration = rawNarration.replace(amountMatch[0], " ").trim();
  rawNarration = rawNarration.replace(/^[-,:\s]+|[-,:\s]+$/g, "").trim();

  // 4. Set Type: Default to "Expense" unless specified as credit/income
  const finalType = detectTransactionType({
    amountRaw: amountMatch[0],
    narration: trimmed,
  });

  // 5. Extract Category: Match keywords
  const cleanedNote = cleanNarration(rawNarration || trimmed);
  const finalCategory = autoCategorize(cleanedNote, trimmed, finalType);

  return {
    Date: finalDate,
    date: finalDate,
    Description: cleanedNote,
    Narration: cleanedNote,
    Note: cleanedNote,
    note: cleanedNote,
    Amount: amount,
    amount: amount,
    Type: finalType,
    type: finalType,
    Category: finalCategory,
    category: finalCategory,
    Source: finalCategory,
    source: finalCategory,
    Account: "Online",
    accountType: "Online",
    rawNarration: trimmed,
  };
};

/**
 * Splits document content by newlines and iterates over EVERY valid line using a loop.
 * Does NOT stop after the first row.
 */
export const parseMultiLineText = (content, fallbackDate = null) => {
  if (!content || typeof content !== "string") return [];
  const lines = content.split(/\r?\n/);
  const transactions = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tx = parseLineToTransaction(trimmed, fallbackDate);
    if (tx) {
      transactions.push(tx);
    }
  }

  return transactions;
};

/**
 * Helper to dynamically detect header keys from raw row objects
 */
const findMatchingKey = (obj, regexPattern) => {
  const keys = Object.keys(obj);
  return keys.find((k) => regexPattern.test(k.trim())) || null;
};

/**
 * Transforms a raw dictionary row into a structured FinSight transaction object
 */
export const transformRawRowToTransaction = (row) => {
  if (!row || typeof row !== "object") return null;

  // Search for date column
  const dateKey = findMatchingKey(
    row,
    /^(date|txn_date|transaction_date|value_date|posting_date)$/i
  );
  const rawDate = dateKey ? row[dateKey] : row.Date || row.date;

  // Search for narration / description column
  const narrKey = findMatchingKey(
    row,
    /^(description|narration|particulars|remarks|details|note|merchant|payee|name)$/i
  );
  const rawNarration = narrKey
    ? row[narrKey]
    : row.Description || row.Narration || row.Note || row.Particulars || "";

  // Search for separate Debit / Credit columns
  const debitKey = findMatchingKey(row, /^(debit|withdrawal|dr|expense|debit_amount)$/i);
  const creditKey = findMatchingKey(row, /^(credit|deposit|cr|income|credit_amount)$/i);
  const debitVal = debitKey ? cleanAmount(row[debitKey]) : 0;
  const creditVal = creditKey ? cleanAmount(row[creditKey]) : 0;

  // Search for unified amount and type column
  const amountKey = findMatchingKey(row, /^(amount|txn_amount|transaction_amount|sum|value)$/i);
  const typeKey = findMatchingKey(row, /^(type|txn_type|transaction_type|cr_dr|dr_cr)$/i);

  let rawAmount = amountKey ? row[amountKey] : row.Amount || row.amount || 0;
  let typeCol = typeKey ? row[typeKey] : row.Type || row.type || "";

  let finalAmount = 0;
  let finalType = "Expense";

  if (debitVal > 0) {
    finalAmount = debitVal;
    finalType = "Expense";
  } else if (creditVal > 0) {
    finalAmount = creditVal;
    finalType = "Income";
  } else {
    finalAmount = cleanAmount(rawAmount);
    finalType = detectTransactionType({
      amountRaw: rawAmount,
      narration: rawNarration,
      typeColumn: typeCol,
    });
  }

  if (finalAmount <= 0) {
    return null;
  }

  const cleanedNote = cleanNarration(rawNarration);
  const finalCategory = autoCategorize(cleanedNote, rawNarration, finalType);
  const finalDate = normalizeDate(rawDate);

  return {
    Date: finalDate,
    date: finalDate,
    Description: cleanedNote,
    Narration: cleanedNote,
    Note: cleanedNote,
    note: cleanedNote,
    Amount: finalAmount,
    amount: finalAmount,
    Type: finalType,
    type: finalType,
    Category: finalCategory,
    category: finalCategory,
    Source: finalCategory,
    source: finalCategory,
    Account: "Online",
    accountType: "Online",
    rawNarration: String(rawNarration || ""),
  };
};

/**
 * 6. Multi-Line CSV / Text Parser Engine (PapaParse + Line-by-Line Iteration)
 * Iterates over EVERY valid non-empty line using a loop without stopping after the first row.
 */
export const parseCSV = async (file) => {
  const PapaModule = await import("papaparse");
  const Papa = PapaModule.default || PapaModule;
  const content = await file.text();
  const rawLines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Attempt standard structured PapaParse first
  const parsedStructured = await new Promise((resolve) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      complete: (results) => {
        try {
          const rawRows = results.data || [];
          const txList = [];
          for (const row of rawRows) {
            const tx = transformRawRowToTransaction(row);
            if (tx) txList.push(tx);
          }
          resolve(txList);
        } catch {
          resolve([]);
        }
      },
      error: () => resolve([]),
    });
  });

  // If structured parsing converted all lines, return it
  if (parsedStructured.length >= rawLines.length && parsedStructured.length > 0) {
    return parsedStructured;
  }

  // Otherwise, split document content by newlines and iterate over EVERY valid line!
  const lineTransactions = parseMultiLineText(content);
  return lineTransactions.length >= parsedStructured.length ? lineTransactions : parsedStructured;
};

/**
 * 7. Multi-Row Excel Parser Engine (SheetJS / xlsx)
 * Iterates through every row in the spreadsheet.
 */
export const parseExcel = async (file) => {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const transactions = [];
  for (const row of rawRows) {
    let tx = transformRawRowToTransaction(row);
    if (!tx) {
      const lineStr = Object.values(row).join(" ");
      tx = parseLineToTransaction(lineStr);
    }
    if (tx) transactions.push(tx);
  }

  return transactions;
};

/**
 * 8. Multi-Line PDF Text Parser Engine (pdfjs-dist)
 * Extracts line-by-line raw text strings from PDF statements and iterates over every line.
 */
export const parsePDF = async (file) => {
  const pdfjsLib = await import("pdfjs-dist");
  try {
    if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions?.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).href;
    }
  } catch (workerErr) {
    console.warn("Could not set local pdfjs worker URL:", workerErr);
  }

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const extractedLines = [];

  // Iterate across all pages and reconstruct line-by-line text
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items || [];

    // Group items by Y coordinate with small delta tolerance (3px)
    const lineMap = new Map();

    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);

      // Find existing line bucket within delta
      let foundKey = null;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 3) {
          foundKey = existingY;
          break;
        }
      }

      const targetKey = foundKey !== null ? foundKey : y;
      if (!lineMap.has(targetKey)) {
        lineMap.set(targetKey, []);
      }
      lineMap.get(targetKey).push({ x, str: item.str });
    }

    // Sort lines top-to-bottom (higher Y to lower Y in PDF coordinates)
    const sortedYKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const yKey of sortedYKeys) {
      const lineItems = lineMap.get(yKey);
      lineItems.sort((a, b) => a.x - b.x);
      const fullLine = lineItems
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (fullLine.length >= 2) {
        // Handle lines that may contain embedded newlines
        const subLines = fullLine.split(/\r?\n/);
        for (const s of subLines) {
          if (s.trim()) extractedLines.push(s.trim());
        }
      }
    }
  }

  const transactions = [];

  // Iterate over EVERY valid non-empty line using a loop without stopping after the first row
  for (const line of extractedLines) {
    const tx = parseLineToTransaction(line);
    if (tx) {
      transactions.push(tx);
    }
  }

  return transactions;
};

/**
 * 9. Master Document Ingestion Pipeline
 * Unified interface for parsing multi-line PDF, CSV, XLSX, XLS, and TXT files.
 */
export const parseStatementFile = async (file) => {
  const validation = validateStatementFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const { extension } = validation;
  let transactions = [];

  try {
    if (extension === "csv" || extension === "txt") {
      transactions = await parseCSV(file);
    } else if (extension === "xlsx" || extension === "xls") {
      transactions = await parseExcel(file);
    } else if (extension === "pdf") {
      transactions = await parsePDF(file);
    } else {
      return { success: false, error: `Unsupported file type: .${extension}` };
    }

    if (!transactions || transactions.length === 0) {
      return {
        success: false,
        error: "No valid transaction rows could be extracted from this document.",
      };
    }

    const totalExpense = transactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      success: true,
      transactions,
      meta: {
        fileName: file.name,
        fileSize: file.size,
        extension,
        rowCount: transactions.length,
        totalExpense,
        totalIncome,
        parsedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Statement Ingestion Pipeline Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred while parsing the document.",
    };
  }
};

/**
 * 10. Bulk Firestore Batch Write & Real-Time Auto-Sync Engine
 * Writes parsed transactions to `users/{uid}/transactions` in atomic chunks <= 450 items.
 */
export const batchSyncTransactionsToFirestore = async (transactionsList, explicitUid = null) => {
  const uid = explicitUid || auth.currentUser?.uid;

  if (!uid) {
    return {
      success: false,
      unauthenticated: true,
      error: "No authenticated user UID found.",
    };
  }

  if (!transactionsList || transactionsList.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const CHUNK_SIZE = 450;
    let savedCount = 0;

    for (let i = 0; i < transactionsList.length; i += CHUNK_SIZE) {
      const chunk = transactionsList.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      const expensesCol = collection(db, "users", uid, "expenses");
      const incomeCol = collection(db, "users", uid, "income");

      for (const t of chunk) {
        const isIncome = String(t.type || "").toLowerCase() === "income";
        const type = isIncome ? "Income" : "Expense";
        const category = t.category || t.source || (isIncome ? "Salary" : "Shopping");
        const amount = Number(t.amount) || 0;

        const payload = {
          userId: uid,
          type,
          amount,
          date: t.date || new Date().toISOString().slice(0, 10),
          accountType: t.accountType || "Online",
          category,
          source: category,
          note: t.note || t.narration || t.description || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const targetCol = isIncome ? incomeCol : expensesCol;
        const docRef = doc(targetCol);
        batch.set(docRef, payload);
      }

      await batch.commit();
      savedCount += chunk.length;
    }

    return { success: true, count: savedCount };
  } catch (error) {
    console.error("Firestore batch commit error:", error);
    return { success: false, error: error.message || String(error) };
  }
};
