/**
 * FinSight AI - Global Application Constants & Design System Tokens
 * Central source of truth for categories, currency, accounts, AI prompts, and business thresholds.
 */

// ==========================================
// 1. Transaction Categories & Classifications
// ==========================================

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Education",
  "Others",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Bonus",
  "Business",
  "Others",
];

export const ACCOUNT_TYPES = ["Cash", "Online", "Bank", "Card", "Savings"];

export const CATEGORY_KEYWORDS = {
  Food: [
    "food", "swiggy", "zomato", "restaurant", "cafe", "coffee", "bistro",
    "dinner", "lunch", "breakfast", "grocer", "supermarket", "bakery", "mcdonald", "starbucks", "subway", "domino", "pizza", "burger", "biryani", "chai", "tea", "snack"
  ],
  Shopping: [
    "shopping", "shop", "cloth", "amazon", "flipkart", "myntra", "zara",
    "h&m", "retail", "store", "mall", "electronics", "gadget", "apparel", "footwear", "shoes", "fashion", "purchase"
  ],
  Bills: [
    "bill", "recharge", "electr", "wifi", "broadband", "water", "gas",
    "cylinder", "dth", "mobile", "jio", "airtel", "vi", "utility", "maintenance", "rent", "emi", "subscription", "netflix", "spotify"
  ],
  Salary: [
    "salary", "payroll", "stipend", "bonus", "earnings", "wages", "employer", "credited"
  ],
  Travel: [
    "travel", "uber", "ola", "fuel", "petrol", "diesel", "flight", "indigo",
    "train", "irctc", "bus", "redbus", "metro", "toll", "fastag", "cab", "auto", "taxi", "hotel", "stay"
  ],
  Health: [
    "health", "med", "doctor", "hospital", "pharmacy", "clinic", "lab",
    "test", "apollo", "1mg", "pharmeasy", "dentist", "gym", "fitness"
  ],
  Education: [
    "education", "course", "school", "college", "tuition", "udemy",
    "coursera", "book", "exam", "fee", "classes"
  ],
  Investment: [
    "investment", "invest", "stock", "share", "mutual fund", "zerodha",
    "groww", "sip", "crypto", "dividend", "interest", "deposit", "gold"
  ],
  Freelance: [
    "freelance", "upwork", "fiverr", "client", "project payment", "consulting"
  ],
};

// ==========================================
// 2. Currency, Locales & Formatter
// ==========================================

export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_CURRENCY_SYMBOL = "₹";
export const DEFAULT_LOCALE = "en-IN";

export const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR (₹ - Indian Rupee)", locale: "en-IN" },
  { code: "USD", symbol: "$", label: "USD ($ - US Dollar)", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "EUR (€ - Euro)", locale: "de-DE" },
  { code: "GBP", symbol: "£", label: "GBP (£ - British Pound)", locale: "en-GB" },
  { code: "JPY", symbol: "¥", label: "JPY (¥ - Japanese Yen)", locale: "ja-JP" },
  { code: "AED", symbol: "AED", label: "AED (UAE Dirham)", locale: "ar-AE" },
];

let activeUserPreferences = {
  currency: DEFAULT_CURRENCY,
  locale: DEFAULT_LOCALE,
};

/**
 * Updates the active user preference state for formatting.
 * Typically synchronized from users/{uid}/settings/preferences in Firestore.
 */
export const setUserPreferences = (prefs = {}) => {
  if (prefs?.currency) {
    activeUserPreferences.currency = prefs.currency;
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === prefs.currency);
    if (found?.locale) {
      activeUserPreferences.locale = found.locale;
    }
  }
  if (prefs?.locale) {
    activeUserPreferences.locale = prefs.locale;
  }
};

/**
 * Returns current active user preferences.
 */
export const getUserPreferences = () => ({ ...activeUserPreferences });

/**
 * Global dynamic currency formatting helper using standard Intl.NumberFormat.
 * Driven by user preferences from Firestore or falls back safely to default locale/currency.
 *
 * @param {number|string} amount
 * @param {Object} [options={}]
 * @returns {string}
 */
export const formatCurrency = (amount, options = {}) => {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  const prefs = getUserPreferences();
  const currencyCode = options.currency || prefs.currency || DEFAULT_CURRENCY;
  const locale = options.locale || prefs.locale || DEFAULT_LOCALE;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: options.fractionDigits ?? (Number.isInteger(num) ? 0 : 2),
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
    }).format(num);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${Number(num).toLocaleString(locale)}`;
  }
};

/**
 * Returns currency symbol for a currency code or currently active currency preference.
 */
export const getCurrencySymbol = (currencyCode) => {
  const code = currencyCode || getUserPreferences().currency || DEFAULT_CURRENCY;
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return found ? found.symbol : DEFAULT_CURRENCY_SYMBOL;
};

/**
 * Dynamic date formatting helper respecting user's active locale preference.
 *
 * @param {Date|string|number} date
 * @param {Object} [options={}]
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const locale = options.locale || getUserPreferences().locale || DEFAULT_LOCALE;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    ...(options.formatOptions || {}),
  });
};

// ==========================================
// 3. Default User Accounts (for initial seeding)
// ==========================================

export const DEFAULT_ACCOUNTS = [
  {
    id: "acc_cash",
    name: "Cash",
    type: "Cash",
    iconType: "cash",
    initialBalance: 0,
    color: "emerald",
  },
  {
    id: "acc_savings",
    name: "Savings",
    type: "Savings",
    iconType: "savings",
    initialBalance: 0,
    color: "rose",
  },
  {
    id: "acc_online",
    name: "Online",
    type: "Online",
    iconType: "online",
    initialBalance: 0,
    color: "sky",
  },
];

// ==========================================
// 4. AI Advisor Risk Allocations & Strategies
// ==========================================

export const RISK_ALLOCATION = {
  Low: {
    equity: 30,
    debt: 50,
    emergency: 20,
    equityLabel: "30% Large-Cap & Nifty 50 Index Funds",
    debtLabel: "50% Fixed Income, Liquid Funds & Debt Reserves",
    emergencyLabel: "20% High-Yield Emergency Savings",
  },
  Moderate: {
    equity: 50,
    debt: 30,
    emergency: 20,
    equityLabel: "50% Diversified Equity & Flexi-Cap Funds",
    debtLabel: "30% Debt Instruments & Government Bonds",
    emergencyLabel: "20% High-Yield Emergency Buffer",
  },
  Aggressive: {
    equity: 70,
    debt: 15,
    emergency: 15,
    equityLabel: "70% High-Growth Equities & Mid/Small-Cap Index",
    debtLabel: "15% Short-Term Debt & Capital Reserves",
    emergencyLabel: "15% Immediate Liquid Reserve",
  },
};

export const SUGGESTED_TRANSFER_RATIO = 0.4; // 40% of surplus recommended for automated wealth transfer

// ==========================================
// 5. Business Thresholds & Operational Bounds
// ==========================================

export const ANOMALY_SPIKE_STD_DEV_MULTIPLIER = 2.0;
export const ANOMALY_SPIKE_SINGLE_ITEM_MULTIPLIER = 2.5;
export const ANOMALY_DUPLICATE_WINDOW_HOURS = 24;

export const FORECAST_WINDOW_DAYS = 30;
export const FORECAST_MAX_MONTHS = 6;

export const HEATMAP_THRESHOLDS = {
  NO_SPEND: 0,
  LOW: 500,
  MEDIUM: 2000,
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const TOAST_DURATION_MS = 4000;
export const SPLASH_DURATION_MS = 2000;

// UI Labels
export const GUEST_LABEL = "Guest";
export const MEMBER_LABEL = "Member";

// ==========================================
// 6. Dynamic AI Prompt Generators
// ==========================================

export const buildVoiceAIPrompt = () => `You are an expert multilingual AI Financial Logging Assistant.
Extract structured financial transaction data from this spoken speech transcript in English, Hindi, or Hinglish:
Analyze the text carefully.

Return ONLY a valid JSON object with the following fields:
- amount: number (positive number. If "k", "hazaar", "sau" used, compute absolute value, e.g. "4.5k" -> 4500, "500 rupees" -> 500)
- merchant: string (name of the store, company, service or person, e.g. "Swiggy", "Uber", "Electricity Board", "Salary")
- category: string (one of ${JSON.stringify(EXPENSE_CATEGORIES.concat(INCOME_CATEGORIES.filter((c) => !EXPENSE_CATEGORIES.includes(c))))})
- type: string (strictly "expense" or "income")
- date: string (format YYYY-MM-DD. Handle relative terms like "yesterday", "kal", "today", "aaj" relative to current date)
- accountType: string (strictly one of ${JSON.stringify(ACCOUNT_TYPES)})
- note: string (brief description of transaction)

Return ONLY pure JSON without markdown fences, code blocks, or extra text.`;

export const buildVisionAIPrompt = () => `You are a financial receipt and invoice OCR assistant. 
Analyze the provided receipt or invoice image carefully.
Extract transaction details into valid JSON format with keys:
- merchant (string: name of the store, business, or service provider)
- date (string: transaction date formatted strictly as YYYY-MM-DD. If missing, use today's date)
- totalAmount (number: the final total paid/due amount as a positive number)
- category (string: one of ${JSON.stringify(EXPENSE_CATEGORIES)})
- description (string: brief summary of items purchased or purpose)
- paymentType (string: strictly one of ["Credit", "Debit", "Cash", "Online"])

Return ONLY a clean JSON object without any markdown code fences, comments, or extra text.`;
