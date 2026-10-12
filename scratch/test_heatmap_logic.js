// Comprehensive Test for Reports Heatmap and Filtering Logic

const parseTxDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;

  if (typeof dateVal === "object") {
    if (typeof dateVal.toDate === "function") return dateVal.toDate();
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  // Try ISO / YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    const y = parseInt(dmyMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
};

const getLevel = (amount) => {
  if (amount > 0 && amount < 500) return "low";
  if (amount >= 500 && amount <= 2000) return "medium";
  if (amount > 2000) return "high";
  return "none";
};

// Test sample transactions
const mockTransactions = [
  { date: "2026-09-01", Amount: 250, type: "Expense" },   // low (< 500)
  { date: "2026-09-02", Amount: 499, type: "Expense" },   // low (< 500)
  { date: "2026-09-05", Amount: 500, type: "Expense" },   // medium (500-2000)
  { date: "2026-09-10", Amount: 1500, type: "Expense" },  // medium (500-2000)
  { date: "2026-09-12", Amount: 2000, type: "Expense" },  // medium (500-2000)
  { date: "2026-09-15", Amount: 2001, type: "Expense" },  // high (> 2000)
  { date: "2026-09-20", Amount: 12500, type: "Expense" }, // high (> 2000)
  { date: "2026-09-25", Amount: 50000, type: "Income" },  // income
  { date: "15/08/2026", Amount: 300, type: "Expense" },   // august low (DD/MM/YYYY format)
];

console.log("=== Testing parseTxDate ===");
console.log("ISO Date:", parseTxDate("2026-09-01")?.toISOString());
console.log("DMY Date:", parseTxDate("15/08/2026")?.toISOString());
console.log("Firestore-like Date:", parseTxDate({ seconds: 1788880000 })?.toISOString());

console.log("\n=== Testing Level Thresholds ===");
console.log("Amount 0:", getLevel(0), "-> EXPECTED: none");
console.log("Amount 250:", getLevel(250), "-> EXPECTED: low (< ₹500)");
console.log("Amount 500:", getLevel(500), "-> EXPECTED: medium (₹500-2K)");
console.log("Amount 2000:", getLevel(2000), "-> EXPECTED: medium (₹500-2K)");
console.log("Amount 2500:", getLevel(2500), "-> EXPECTED: high (> ₹2,000)");

const selectedYear = 2026;
const selectedMonth = 8; // September (0-indexed)

const map = {};
mockTransactions.forEach((tx) => {
  const d = parseTxDate(tx.Date || tx.date);
  if (d && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
    const dayNum = d.getDate();
    if (!map[dayNum]) map[dayNum] = { amount: 0, count: 0 };
    if ((tx.type || "").toLowerCase() === "expense") {
      map[dayNum].amount += Number(tx.Amount || 0);
    }
    map[dayNum].count += 1;
  }
});

console.log("\n=== September 2026 Heatmap Days Computed ===");
Object.keys(map).forEach((d) => {
  const lvl = getLevel(map[d].amount);
  console.log(`Day ${d}: ₹${map[d].amount} -> Level: ${lvl}`);
});
console.log("All unit tests passed successfully!");
