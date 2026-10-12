import {
  calculateCategoryStats,
  detectAnomalies,
} from "../frontend/src/utils/AnomalyDetector.js";

console.log("=== RUNNING ANOMALY DETECTOR TESTS ===");

// 1. Test Statistical Calculation (Mean & Standard Deviation)
const values = [500, 600, 550, 450, 700]; // Mean = 560
const stats = calculateCategoryStats(values);
console.log("Category Stats (Mean, StdDev, Threshold):", stats);

if (stats.mean === 560 && stats.stdDev > 0 && stats.threshold > stats.mean) {
  console.log("✅ Math baseline test passed!");
} else {
  console.error("❌ Math baseline test failed!");
  process.exit(1);
}

// 2. Test High-Spike Anomaly Detection (> Mean + 2*StdDev)
const mockTransactions = [
  // Normal Dining expenses (Avg ~ ₹500)
  { id: "t1", type: "Expense", amount: 450, date: "2026-03-01", category: "Dining", note: "Cafe Coffee Day" },
  { id: "t2", type: "Expense", amount: 550, date: "2026-03-05", category: "Dining", note: "Subway" },
  { id: "t3", type: "Expense", amount: 500, date: "2026-03-10", category: "Dining", note: "McDonalds" },
  { id: "t4", type: "Expense", amount: 600, date: "2026-03-15", category: "Dining", note: "Dominos Pizza" },

  // Extreme spike: ₹4,500 on Dining
  { id: "t5", type: "Expense", amount: 4500, date: "2026-03-20", category: "Dining", note: "Luxury Bistro Dinner" },

  // Duplicate charge within 24 hours (₹299 debited twice by Netflix)
  { id: "t6", type: "Expense", amount: 299, date: "2026-03-22T10:00:00", category: "Entertainment", note: "Netflix Subscription" },
  { id: "t7", type: "Expense", amount: 299, date: "2026-03-22T18:30:00", category: "Entertainment", note: "Netflix Subscription" },

  // Monthly Recurring subscription (Spotify in Feb and Mar spaced ~30 days apart)
  { id: "t8", type: "Expense", amount: 119, date: "2026-02-15", category: "Bills", note: "Spotify Premium" },
  { id: "t9", type: "Expense", amount: 119, date: "2026-03-17", category: "Bills", note: "Spotify Premium" },
];

const result = detectAnomalies(mockTransactions);
console.log("\nDetection Result Overview:", {
  status: result.status,
  badgeText: result.badgeText,
  activeAnomaliesCount: result.activeAnomaliesCount,
  anomalies: result.anomalies.map((a) => ({
    type: a.type,
    severity: a.severity,
    message: a.message,
  })),
});

// Validate Spike Anomaly
const spikeAnomaly = result.anomalies.find((a) => a.type === "high_spike");
if (
  spikeAnomaly &&
  spikeAnomaly.amount === 4500 &&
  spikeAnomaly.message.includes("Unusual Spike") &&
  spikeAnomaly.message.includes("Dining")
) {
  console.log("✅ High Spike Anomaly Flagged Correctly:", spikeAnomaly.message);
} else {
  console.error("❌ High Spike Anomaly Test Failed!");
  process.exit(1);
}

// Validate Duplicate Charge Anomaly
const duplicateAnomaly = result.anomalies.find((a) => a.type === "duplicate");
if (
  duplicateAnomaly &&
  duplicateAnomaly.amount === 299 &&
  duplicateAnomaly.message.includes("Possible Duplicate Charge") &&
  duplicateAnomaly.message.includes("Netflix")
) {
  console.log("✅ Duplicate Charge Flagged Correctly:", duplicateAnomaly.message);
} else {
  console.error("❌ Duplicate Charge Test Failed!");
  process.exit(1);
}

// Validate Clean State when no spikes exist
const cleanTransactions = [
  { id: "c1", type: "Expense", amount: 500, date: "2026-03-01", category: "Food", note: "Groceries" },
  { id: "c2", type: "Expense", amount: 520, date: "2026-03-05", category: "Food", note: "Groceries" },
  { id: "c3", type: "Expense", amount: 480, date: "2026-03-10", category: "Food", note: "Groceries" },
];

const cleanResult = detectAnomalies(cleanTransactions);
console.log("\nClean State Result:", {
  status: cleanResult.status,
  badgeText: cleanResult.badgeText,
  activeAnomaliesCount: cleanResult.activeAnomaliesCount,
});

if (cleanResult.status === "clean" && cleanResult.badgeText === "Financial Health: Clean") {
  console.log("✅ Clean Financial Health State Passed!");
} else {
  console.error("❌ Clean Health State Test Failed!");
  process.exit(1);
}

console.log("\n✨ ALL ANOMALY DETECTOR TESTS PASSED WITH 100% ACCURACY! ✨");
