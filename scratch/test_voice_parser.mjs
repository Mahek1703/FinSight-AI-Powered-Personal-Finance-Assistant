import {
  parseHeuristicVoice,
  sanitizeVoiceGeminiResponse,
  normalizeVoiceCategory,
  normalizeVoiceAccountType,
} from "../frontend/src/services/geminiVoice.service.js";

console.log("=== RUNNING VOICE ASSISTANT PARSER TESTS ===");

// Test 1: Hinglish Swiggy Expense
const t1 = parseHeuristicVoice("Swiggy par 450 rupees kharch kiye dinner ke liye");
console.log("Test 1 Result:", t1);
if (
  t1.amount === 450 &&
  t1.category === "Food" &&
  t1.merchant === "Swiggy" &&
  t1.type === "Expense"
) {
  console.log("✅ Test 1 PASSED: Hinglish Swiggy expense parsed accurately");
} else {
  console.error("❌ Test 1 FAILED:", t1);
  process.exit(1);
}

// Test 2: English Utility Bill with Relative Date & Payment Mode
const t2 = parseHeuristicVoice("Paid 1200 for electricity bill via card yesterday");
console.log("Test 2 Result:", t2);
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
if (
  t2.amount === 1200 &&
  t2.category === "Bills" &&
  t2.type === "Expense" &&
  t2.accountType === "Card" &&
  t2.date === yesterdayStr
) {
  console.log("✅ Test 2 PASSED: Electricity bill with relative date and card payment parsed accurately");
} else {
  console.error("❌ Test 2 FAILED:", t2);
  process.exit(1);
}

// Test 3: Income with Bank account
const t3 = parseHeuristicVoice("Received 50000 salary credit from Google in bank");
console.log("Test 3 Result:", t3);
if (
  t3.amount === 50000 &&
  t3.category === "Salary" &&
  t3.type === "Income" &&
  t3.accountType === "Bank"
) {
  console.log("✅ Test 3 PASSED: Salary income credit parsed accurately");
} else {
  console.error("❌ Test 3 FAILED:", t3);
  process.exit(1);
}

// Test 4: Currency abbreviations (4.5k) & Shopping
const t4 = parseHeuristicVoice("Spent 4.5k on shopping on Amazon with online UPI");
console.log("Test 4 Result:", t4);
if (
  t4.amount === 4500 &&
  t4.category === "Shopping" &&
  t4.merchant === "Amazon" &&
  t4.accountType === "Online"
) {
  console.log("✅ Test 4 PASSED: 4.5k abbreviation & merchant parsed accurately");
} else {
  console.error("❌ Test 4 FAILED:", t4);
  process.exit(1);
}

// Test 5: Gemini JSON Sanitizer
const rawGeminiOutput = `\`\`\`json
{
  "amount": 350,
  "merchant": "Uber",
  "category": "Travel",
  "date": "2026-03-24",
  "type": "expense",
  "accountType": "Cash",
  "note": "Uber ride to office"
}
\`\`\``;

const sanitized = sanitizeVoiceGeminiResponse(rawGeminiOutput, "Uber cab 350 rupees");
console.log("Test 5 Result:", sanitized);
if (
  sanitized.amount === 350 &&
  sanitized.merchant === "Uber" &&
  sanitized.category === "Travel" &&
  sanitized.type === "Expense"
) {
  console.log("✅ Test 5 PASSED: Gemini JSON sanitizer parsed code fences cleanly");
} else {
  console.error("❌ Test 5 FAILED:", sanitized);
  process.exit(1);
}

console.log("\n🎉 ALL 5 VOICE PARSER UNIT TESTS PASSED WITH 100% SUCCESS!");
