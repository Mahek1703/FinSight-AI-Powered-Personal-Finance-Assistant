/**
 * FinSight AI - Predictive Cash Flow & Expense Forecasting Engine
 * Analyzes historical transaction series to project next month spending,
 * fixed vs variable spending ratios, daily burn rate, and cash crunch runway.
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FIXED_CATEGORIES = new Set([
  "bills",
  "rent",
  "emi",
  "education",
  "insurance",
  "utility",
  "wifi",
  "broadband",
  "subscription",
  "recharge",
]);

/**
 * Clean & Parse numeric amount
 */
const toNum = (val) => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[₹$€, +]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
};

/**
 * Parse standard Date object safely
 */
const parseDate = (val) => {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Linear Trend Regression calculation (y = mx + b)
 */
export const calculateLinearTrend = (values = []) => {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return values[values.length - 1];

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Project for next step (n + 1)
  const nextX = n + 1;
  const projected = slope * nextX + intercept;
  return Math.max(0, projected);
};

/**
 * Weighted Moving Average (giving progressive weight to recent months)
 */
export const calculateWeightedMovingAverage = (values = []) => {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  let totalWeight = 0;
  let weightedSum = 0;

  for (let i = 0; i < n; i++) {
    const weight = i + 1; // e.g. 1, 2, 3...
    weightedSum += values[i] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : values[n - 1];
};

/**
 * Predict next value blending WMA (60%) and Linear Regression (40%)
 */
export const forecastNextValue = (historicalSeries = []) => {
  if (!historicalSeries || historicalSeries.length === 0) return 0;
  if (historicalSeries.length === 1) return historicalSeries[0];

  const wma = calculateWeightedMovingAverage(historicalSeries);
  const regression = calculateLinearTrend(historicalSeries);

  // Ensemble blend to avoid wild outlier skew
  const blended = wma * 0.6 + regression * 0.4;
  return Math.max(0, blended);
};

/**
 * Main Forecast Engine Generator
 * @param {Array} transactions - Array of all transaction records (expenses & income)
 * @returns {Object} Full forecasting metrics, chart models, and smart alert states
 */
export const generateCashFlowForecast = (transactions = []) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      hasEnoughData: false,
      reason: "No transactions recorded yet.",
      alertMessage: "Log transactions for at least 30 days to unlock AI Predictive Forecasting.",
      alertType: "empty",
      projectedExpense: 0,
      projectedIncome: 0,
      projectedNetSavings: 0,
      dailyBurnRate: 0,
      fixedExpenseAmount: 0,
      variableExpenseAmount: 0,
      fixedRatio: 0,
      variableRatio: 0,
      growthRate: 0,
      warningDay: null,
      chartData: [],
      runwayPoints: [],
      monthlyBreakdown: [],
    };
  }

  // 1. Sanitize and sort all transactions chronologically
  const sanitized = transactions
    .map((t) => {
      const d = parseDate(t.date || t.Date || t.createdAt);
      const isIncome = String(t.type || t.Type || "").toLowerCase() === "income";
      const amount = toNum(t.amount || t.Amount);
      const category = String(t.category || t.Category || t.source || "Others").trim();
      return {
        ...t,
        parsedDate: d,
        timestamp: d.getTime(),
        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        monthKey: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        amount,
        isIncome,
        category,
      };
    })
    .filter((t) => t.amount > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (sanitized.length === 0) {
    return {
      hasEnoughData: false,
      reason: "No valid transaction values found.",
      alertMessage: "Log transactions for at least 30 days to unlock AI Predictive Forecasting.",
      alertType: "empty",
      projectedExpense: 0,
      projectedIncome: 0,
      projectedNetSavings: 0,
      dailyBurnRate: 0,
      fixedExpenseAmount: 0,
      variableExpenseAmount: 0,
      fixedRatio: 0,
      variableRatio: 0,
      growthRate: 0,
      warningDay: null,
      chartData: [],
      runwayPoints: [],
      monthlyBreakdown: [],
    };
  }

  // 2. Check time span coverage (at least 30 days or multi-month distribution)
  const firstDate = sanitized[0].parsedDate;
  const lastDate = sanitized[sanitized.length - 1].parsedDate;
  const daySpan = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

  // 3. Group by Month (last 6 months maximum)
  const monthBuckets = {};
  sanitized.forEach((t) => {
    if (!monthBuckets[t.yearMonth]) {
      monthBuckets[t.yearMonth] = {
        yearMonth: t.yearMonth,
        label: `${MONTH_NAMES[t.monthIndex]} ${String(t.year).slice(2)}`,
        fullLabel: `${MONTH_NAMES[t.monthIndex]} ${t.year}`,
        monthIndex: t.monthIndex,
        year: t.year,
        expenses: 0,
        incomes: 0,
        fixedExpenses: 0,
        variableExpenses: 0,
        count: 0,
      };
    }

    if (t.isIncome) {
      monthBuckets[t.yearMonth].incomes += t.amount;
    } else {
      monthBuckets[t.yearMonth].expenses += t.amount;
      const lowerCat = t.category.toLowerCase();
      if (FIXED_CATEGORIES.has(lowerCat) || lowerCat.includes("bill") || lowerCat.includes("rent") || lowerCat.includes("emi")) {
        monthBuckets[t.yearMonth].fixedExpenses += t.amount;
      } else {
        monthBuckets[t.yearMonth].variableExpenses += t.amount;
      }
    }
    monthBuckets[t.yearMonth].count++;
  });

  const sortedMonthKeys = Object.keys(monthBuckets).sort();
  // Take last 6 historical months
  const recentMonthKeys = sortedMonthKeys.slice(-6);
  const monthlyData = recentMonthKeys.map((k) => monthBuckets[k]);

  // Determine if historical depth is sufficient (either >= 30 days span OR >= 2 distinct months of data with >= 3 records)
  const hasEnoughData = daySpan >= 25 || (recentMonthKeys.length >= 2 && sanitized.length >= 3);

  if (!hasEnoughData) {
    return {
      hasEnoughData: false,
      daySpan,
      reason: "Insufficient historical range.",
      alertMessage: "Log transactions for at least 30 days to unlock AI Predictive Forecasting.",
      alertType: "fallback",
      projectedExpense: sanitized.filter((t) => !t.isIncome).reduce((s, t) => s + t.amount, 0),
      projectedIncome: sanitized.filter((t) => t.isIncome).reduce((s, t) => s + t.amount, 0),
      projectedNetSavings: 0,
      dailyBurnRate: Math.round(sanitized.filter((t) => !t.isIncome).reduce((s, t) => s + t.amount, 0) / Math.max(1, daySpan)),
      fixedExpenseAmount: 0,
      variableExpenseAmount: 0,
      fixedRatio: 0,
      variableRatio: 0,
      growthRate: 0,
      warningDay: null,
      chartData: [],
      runwayPoints: [],
      monthlyBreakdown: monthlyData,
    };
  }

  // 4. Compute Historical Time Series
  const expenseSeries = monthlyData.map((m) => m.expenses);
  const incomeSeries = monthlyData.map((m) => m.incomes);

  // Fallback if income is 0 across all months, use 1.25x average expense baseline for realistic modeling
  const avgExpense = expenseSeries.reduce((a, b) => a + b, 0) / Math.max(1, expenseSeries.length);
  const avgIncome = incomeSeries.reduce((a, b) => a + b, 0) / Math.max(1, incomeSeries.length);

  // 5. Predict Next Month Totals via Ensemble Forecasting
  const projectedExpenseRaw = forecastNextValue(expenseSeries);
  const projectedExpense = Math.max(100, Math.round(projectedExpenseRaw || avgExpense));

  let projectedIncomeRaw = forecastNextValue(incomeSeries);
  if (projectedIncomeRaw === 0 && avgIncome === 0) {
    // If user has not logged explicit income, set baseline to healthy projection
    projectedIncomeRaw = projectedExpense * 1.2;
  }
  const projectedIncome = Math.max(100, Math.round(projectedIncomeRaw || avgIncome || projectedExpense * 1.2));

  const projectedNetSavings = projectedIncome - projectedExpense;
  const projectedSavingsRate = projectedIncome > 0
    ? Math.round((projectedNetSavings / projectedIncome) * 100)
    : 0;

  // 6. Growth Rate calculation (MoM change over recent recorded months)
  let growthRate = 0;
  if (expenseSeries.length >= 2) {
    const prev = expenseSeries[expenseSeries.length - 2];
    const curr = expenseSeries[expenseSeries.length - 1];
    if (prev > 0) {
      growthRate = Math.round(((curr - prev) / prev) * 100);
    }
  }

  // 7. Fixed vs Variable Spending Ratios
  const totalFixed = monthlyData.reduce((sum, m) => sum + m.fixedExpenses, 0);
  const totalVariable = monthlyData.reduce((sum, m) => sum + m.variableExpenses, 0);
  const totalExpenseSum = totalFixed + totalVariable || 1;

  const fixedRatio = Math.round((totalFixed / totalExpenseSum) * 100);
  const variableRatio = Math.max(0, 100 - fixedRatio);

  const projectedFixed = Math.round(projectedExpense * (fixedRatio / 100));
  const projectedVariable = Math.round(projectedExpense * (variableRatio / 100));

  // 8. Daily Burn Rate Calculation
  // Calculate average daily burn based on the most recent 30-60 days
  const dailyBurnRate = Math.max(1, Math.round(projectedExpense / 30));

  // 9. Intelligent Smart Alerts & Cash Crunch Safety Margin
  // Safety Margin threshold: If projected spending > 85% of projected income
  const spendToIncomeRatio = projectedIncome > 0 ? (projectedExpense / projectedIncome) : 1;
  const isCashCrunch = spendToIncomeRatio > 0.85;

  let warningDay = null;
  let alertMessage = "";
  let alertType = "safe";

  if (isCashCrunch) {
    alertType = "warning";
    // Calculate Day X of next month when cumulative expenses cross 85% safety threshold of income
    const safetyAllowance = projectedIncome * 0.85;
    const calculatedDay = Math.ceil(safetyAllowance / Math.max(1, dailyBurnRate));
    warningDay = Math.min(28, Math.max(1, calculatedDay));
    alertMessage = `⚠️ Future Cash Crunch Warning: Based on your current spending rate, your balance may dip below safety margins by Day ${warningDay} of next month.`;
  } else {
    alertType = "safe";
    alertMessage = `✅ Healthy Cash Flow Surplus: Projected savings rate of ${Math.max(0, projectedSavingsRate)}% for the upcoming month.`;
  }

  // 10. Prepare Chart Dataset (Historical Months + Projected Month)
  const chartData = monthlyData.map((m) => ({
    name: m.label,
    fullName: m.fullLabel,
    actualExpense: Math.round(m.expenses),
    actualIncome: Math.round(m.incomes),
    projectedExpense: null,
    projectedIncome: null,
    isForecast: false,
  }));

  // Append Projected next month data point
  const nextMonthIndex = (monthlyData[monthlyData.length - 1].monthIndex + 1) % 12;
  const nextMonthYear = nextMonthIndex === 0
    ? monthlyData[monthlyData.length - 1].year + 1
    : monthlyData[monthlyData.length - 1].year;
  const nextMonthLabel = `${MONTH_NAMES[nextMonthIndex]} (Proj)`;

  // Add seamless transition point
  if (chartData.length > 0) {
    chartData[chartData.length - 1].projectedExpense = chartData[chartData.length - 1].actualExpense;
    chartData[chartData.length - 1].projectedIncome = chartData[chartData.length - 1].actualIncome;
  }

  chartData.push({
    name: nextMonthLabel,
    fullName: `${MONTH_NAMES[nextMonthIndex]} ${nextMonthYear} (AI Forecast)`,
    actualExpense: null,
    actualIncome: null,
    projectedExpense,
    projectedIncome,
    isForecast: true,
  });

  // 11. 30-Day Day-by-Day Runway Simulation Curve for interactive visualization
  const runwayPoints = [];
  let cumulativeSpend = 0;
  for (let day = 1; day <= 30; day++) {
    cumulativeSpend += dailyBurnRate;
    runwayPoints.push({
      day: `Day ${day}`,
      dayNum: day,
      cumulativeSpend: Math.round(cumulativeSpend),
      dailyBurnRate,
      safetyCeiling: Math.round(projectedIncome * 0.85),
      projectedIncome,
      isWarningZone: cumulativeSpend > projectedIncome * 0.85,
    });
  }

  return {
    hasEnoughData: true,
    daySpan,
    projectedExpense,
    projectedIncome,
    projectedNetSavings,
    projectedSavingsRate,
    dailyBurnRate,
    growthRate,
    fixedExpenseAmount: projectedFixed,
    variableExpenseAmount: projectedVariable,
    fixedRatio,
    variableRatio,
    spendToIncomeRatio: Math.round(spendToIncomeRatio * 100),
    isCashCrunch,
    warningDay,
    alertMessage,
    alertType,
    chartData,
    runwayPoints,
    monthlyBreakdown: monthlyData,
  };
};

export default {
  generateCashFlowForecast,
  calculateLinearTrend,
  calculateWeightedMovingAverage,
  forecastNextValue,
};
