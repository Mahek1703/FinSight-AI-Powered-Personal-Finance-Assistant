import {
  calculateLinearTrend,
  calculateWeightedMovingAverage,
  forecastNextValue,
  generateCashFlowForecast,
} from "../frontend/src/utils/ForecastEngine.js";

console.log("=== RUNNING PREDICTIVE FORECAST ENGINE TESTS ===");

// 1. Math Algorithms
const sampleSeries = [10000, 12000, 15000, 18000];
const trend = calculateLinearTrend(sampleSeries);
const wma = calculateWeightedMovingAverage(sampleSeries);
const nextForecast = forecastNextValue(sampleSeries);

console.log("Trend projection:", trend);
console.log("WMA projection:", wma);
console.log("Blended Forecast:", nextForecast);

if (nextForecast >= 15000 && nextForecast <= 22000) {
  console.log("✅ Math algorithms passed!");
} else {
  console.error("❌ Math test failed");
  process.exit(1);
}

// 2. Multi-Month Synthetic Transaction History (Cash Crunch Scenario: Expenses > 85% of Income)
const mockCrunchTransactions = [
  // Month 1: Jan
  { type: "Income", amount: 50000, date: "2026-01-01", category: "Salary" },
  { type: "Expense", amount: 15000, date: "2026-01-05", category: "Bills" },
  { type: "Expense", amount: 10000, date: "2026-01-10", category: "Food" },
  { type: "Expense", amount: 18000, date: "2026-01-20", category: "Shopping" },

  // Month 2: Feb
  { type: "Income", amount: 50000, date: "2026-02-01", category: "Salary" },
  { type: "Expense", amount: 16000, date: "2026-02-05", category: "Bills" },
  { type: "Expense", amount: 12000, date: "2026-02-12", category: "Food" },
  { type: "Expense", amount: 20000, date: "2026-02-22", category: "Shopping" },

  // Month 3: Mar
  { type: "Income", amount: 50000, date: "2026-03-01", category: "Salary" },
  { type: "Expense", amount: 17000, date: "2026-03-05", category: "Bills" },
  { type: "Expense", amount: 14000, date: "2026-03-15", category: "Food" },
  { type: "Expense", amount: 22000, date: "2026-03-25", category: "Travel" },
];

const crunchResult = generateCashFlowForecast(mockCrunchTransactions);
console.log("\nCash Crunch Test Result:", {
  hasEnoughData: crunchResult.hasEnoughData,
  projectedExpense: crunchResult.projectedExpense,
  projectedIncome: crunchResult.projectedIncome,
  dailyBurnRate: crunchResult.dailyBurnRate,
  fixedRatio: crunchResult.fixedRatio,
  variableRatio: crunchResult.variableRatio,
  isCashCrunch: crunchResult.isCashCrunch,
  warningDay: crunchResult.warningDay,
  alertMessage: crunchResult.alertMessage,
});

if (
  crunchResult.hasEnoughData &&
  crunchResult.isCashCrunch &&
  crunchResult.warningDay !== null &&
  crunchResult.alertMessage.includes("Future Cash Crunch Warning")
) {
  console.log("✅ Cash Crunch Alert & Day X calculation Passed!");
} else {
  console.error("❌ Cash Crunch Test Failed!");
  process.exit(1);
}

// 3. Healthy Surplus Scenario (Expenses <= 85% of Income)
const mockSurplusTransactions = [
  { type: "Income", amount: 100000, date: "2026-01-01", category: "Salary" },
  { type: "Expense", amount: 15000, date: "2026-01-05", category: "Bills" },
  { type: "Expense", amount: 10000, date: "2026-01-10", category: "Food" },

  { type: "Income", amount: 100000, date: "2026-02-01", category: "Salary" },
  { type: "Expense", amount: 15000, date: "2026-02-05", category: "Bills" },
  { type: "Expense", amount: 12000, date: "2026-02-12", category: "Food" },

  { type: "Income", amount: 100000, date: "2026-03-01", category: "Salary" },
  { type: "Expense", amount: 16000, date: "2026-03-05", category: "Bills" },
  { type: "Expense", amount: 13000, date: "2026-03-15", category: "Food" },
];

const surplusResult = generateCashFlowForecast(mockSurplusTransactions);
console.log("\nSurplus Test Result:", {
  isCashCrunch: surplusResult.isCashCrunch,
  projectedSavingsRate: surplusResult.projectedSavingsRate,
  alertMessage: surplusResult.alertMessage,
});

if (
  !surplusResult.isCashCrunch &&
  surplusResult.projectedSavingsRate > 50 &&
  surplusResult.alertMessage.includes("Healthy Cash Flow Surplus")
) {
  console.log("✅ Healthy Surplus Test Passed!");
} else {
  console.error("❌ Surplus Test Failed!");
  process.exit(1);
}

// 4. Sparse Data Scenario (< 30 days)
const sparseTransactions = [
  { type: "Expense", amount: 200, date: "2026-03-23", category: "Food" },
];
const sparseResult = generateCashFlowForecast(sparseTransactions);
console.log("\nSparse Data Fallback Result:", {
  hasEnoughData: sparseResult.hasEnoughData,
  alertMessage: sparseResult.alertMessage,
});

if (
  !sparseResult.hasEnoughData &&
  sparseResult.alertMessage.includes("Log transactions for at least 30 days")
) {
  console.log("✅ Fallback State Test Passed!");
} else {
  console.error("❌ Sparse Data Fallback Test Failed!");
  process.exit(1);
}

console.log("\n✨ ALL FORECAST ENGINE TESTS PASSED WITH 100% ACCURACY! ✨");
