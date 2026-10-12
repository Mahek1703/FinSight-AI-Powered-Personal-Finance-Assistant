import {
  normalizeReceiptCategory,
  normalizePaymentType,
  sanitizeAndParseGeminiResponse,
} from "../frontend/src/services/geminiVision.service.js";


console.log("--- RUNNING GEMINI VISION OCR UNIT TESTS ---");

// Test 1: Markdown code fences with JSON
const rawGeminiOutput = `\`\`\`json
{
  "merchant": "Starbucks Coffee",
  "date": "2026-09-23",
  "totalAmount": 450.50,
  "category": "Dining and Cafe",
  "description": "Iced Caramel Macchiato and Croissant",
  "paymentType": "Credit Card"
}
\`\`\``;

const parsed1 = sanitizeAndParseGeminiResponse(rawGeminiOutput);
console.log("Test 1 Result (Markdown Code Fences):", parsed1);

if (
  parsed1.merchant === "Starbucks Coffee" &&
  parsed1.totalAmount === 450.50 &&
  parsed1.category === "Food" &&
  parsed1.paymentType === "Credit" &&
  parsed1.date === "2026-09-23"
) {
  console.log("✅ Test 1 Passed!");
} else {
  console.error("❌ Test 1 Failed!");
  process.exit(1);
}

// Test 2: Raw string with currency symbols & string amount
const rawGeminiOutput2 = `{
  "merchant": "Shell Fuel Station",
  "date": "2026-09-20",
  "totalAmount": "₹1,500.00",
  "category": "Petrol",
  "description": "Full tank petrol fuel",
  "paymentType": "UPI / Online"
}`;

const parsed2 = sanitizeAndParseGeminiResponse(rawGeminiOutput2);
console.log("Test 2 Result (Currency formatting):", parsed2);

if (
  parsed2.merchant === "Shell Fuel Station" &&
  parsed2.totalAmount === 1500 &&
  parsed2.category === "Travel" &&
  parsed2.paymentType === "Online"
) {
  console.log("✅ Test 2 Passed!");
} else {
  console.error("❌ Test 2 Failed!");
  process.exit(1);
}

// Test 3: Missing date and invalid amount recovery
const rawGeminiOutput3 = `{
  "merchant": "Reliance Smart Supermarket",
  "totalAmount": "2450.75",
  "category": "Grocery",
  "description": "Weekly grocery shopping",
  "paymentType": "Cash"
}`;

const parsed3 = sanitizeAndParseGeminiResponse(rawGeminiOutput3);
console.log("Test 3 Result (Grocery Category & Today Date):", parsed3);

if (
  parsed3.merchant === "Reliance Smart Supermarket" &&
  parsed3.totalAmount === 2450.75 &&
  parsed3.category === "Food" &&
  parsed3.paymentType === "Cash" &&
  /^\d{4}-\d{2}-\d{2}$/.test(parsed3.date)
) {
  console.log("✅ Test 3 Passed!");
} else {
  console.error("❌ Test 3 Failed!");
  process.exit(1);
}

console.log("\n✨ ALL GEMINI VISION OCR TESTS PASSED SUCCESSFULLY! ✨");
