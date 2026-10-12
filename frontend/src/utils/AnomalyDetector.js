/**
 * FinSight AI - Anomaly & Recurring Subscription Detection Engine
 * Statistical detection for unusual spending spikes, duplicate debits, and recurring charges.
 * READ-ONLY intelligence layer operating dynamically on transaction streams.
 */

const STORAGE_KEY_DISMISSED = "finsight_dismissed_anomalies";

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
 * Parse standard Date object safely (handles Firestore Timestamps too)
 */
const parseDate = (val) => {
  if (!val) return new Date();
  if (typeof val?.toDate === "function") {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      // fallback
    }
  }
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Get dismissed anomaly IDs from localStorage
 */
export const getDismissedAnomalyIds = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DISMISSED);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

/**
 * Dismiss an anomaly by ID
 */
export const dismissAnomalyId = (anomalyId) => {
  if (!anomalyId) return;
  try {
    const set = getDismissedAnomalyIds();
    set.add(anomalyId);
    localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("Failed to persist dismissed anomaly:", err);
  }
};

/**
 * Clear all dismissed anomaly IDs (for testing / reset)
 */
export const clearDismissedAnomalies = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_DISMISSED);
  } catch {
    // ignore
  }
};

/**
 * Calculate mean and sample standard deviation of a numbers array
 */
export const calculateCategoryStats = (values = []) => {
  if (!values || values.length === 0) {
    return { count: 0, mean: 0, stdDev: 0, threshold: 0 };
  }

  const count = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / count;

  if (count < 2) {
    return { count, mean: Number(mean.toFixed(2)), stdDev: 0, threshold: Number((mean * 2.5).toFixed(2)) };
  }

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (count - 1);
  const stdDev = Math.sqrt(variance);

  // Spike threshold: mean + (2 * stdDev)
  const threshold = mean + 2 * stdDev;

  return {
    count,
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    threshold: Number(threshold.toFixed(2)),
  };
};

/**
 * Normalize merchant name string for matching
 */
const normalizeMerchantName = (text = "") => {
  return String(text || "")
    .toLowerCase()
    .replace(/[0-9\-_./\\#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Detect all anomalies from transactions array
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Anomaly detection summary & flagged alerts
 */
export const detectAnomalies = (transactions = []) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      status: "clean",
      badgeText: "Financial Health: Clean",
      badgeColor: "emerald",
      totalAnomaliesCount: 0,
      activeAnomaliesCount: 0,
      anomalies: [],
      categoryStats: {},
    };
  }

  const dismissedSet = getDismissedAnomalyIds();

  // 1. Sanitize expenses only
  const expenses = transactions
    .filter((t) => {
      const type = String(t.type || t.Type || "Expense").toLowerCase();
      return type === "expense" && toNum(t.amount || t.Amount) > 0;
    })
    .map((t, idx) => {
      const d = parseDate(t.date || t.Date || t.createdAt);
      const amount = toNum(t.amount || t.Amount);
      const category = String(t.category || t.Category || t.source || "Others").trim();
      const rawNote = String(t.note || t.Note || t.narration || t.merchant || category).trim();
      const cleanMerchant = normalizeMerchantName(rawNote || category);
      const id = String(t.id || t.firestoreId || `tx_${d.getTime()}_${idx}`);

      return {
        ...t,
        id,
        parsedDate: d,
        timestamp: d.getTime(),
        dateStr: d.toISOString().slice(0, 10),
        amount,
        category,
        merchant: rawNote || category,
        cleanMerchant,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp); // Newest first

  // 2. Group expenses by category to compute statistical baseline (mean & stdDev)
  const categoryAmounts = {};
  expenses.forEach((t) => {
    if (!categoryAmounts[t.category]) {
      categoryAmounts[t.category] = [];
    }
    categoryAmounts[t.category].push(t.amount);
  });

  const categoryStats = {};
  Object.keys(categoryAmounts).forEach((cat) => {
    categoryStats[cat] = calculateCategoryStats(categoryAmounts[cat]);
  });

  const flaggedAnomalies = [];
  const processedSpikeTxIds = new Set();
  const processedDuplicatePairs = new Set();

  // 3. Scan for "High-Spike Anomalies" (amount > mean + 2 * stdDev)
  expenses.forEach((tx) => {
    const allCatAmounts = categoryAmounts[tx.category] || [];
    if (allCatAmounts.length < 3) return; // Require at least 3 historical expenses in category for statistical confidence

    // Calculate baseline by excluding candidate expense to avoid contamination
    const otherAmounts = [];
    let excluded = false;
    for (let idx = 0; idx < allCatAmounts.length; idx++) {
      if (!excluded && allCatAmounts[idx] === tx.amount) {
        excluded = true;
      } else {
        otherAmounts.push(allCatAmounts[idx]);
      }
    }

    const baselineStats =
      otherAmounts.length >= 2
        ? calculateCategoryStats(otherAmounts)
        : categoryStats[tx.category];

    if (!baselineStats || baselineStats.count < 2) return;

    // Check if tx.amount exceeds baseline threshold (mean + 2 * stdDev)
    if (
      tx.amount > baselineStats.threshold &&
      tx.amount >= 400 &&
      tx.amount > baselineStats.mean * 1.35
    ) {
      const pctOverAvg = Math.round(
        ((tx.amount - baselineStats.mean) / Math.max(1, baselineStats.mean)) * 100
      );
      const anomalyId = `spike_${tx.id}`;

      processedSpikeTxIds.add(tx.id);
      flaggedAnomalies.push({
        id: anomalyId,
        type: "high_spike",
        severity: pctOverAvg >= 200 ? "high" : "medium",
        title: "Unusual Spending Spike",
        merchant: tx.merchant,
        category: tx.category,
        amount: tx.amount,
        date: tx.dateStr,
        percentageOverAverage: pctOverAvg,
        averageCategoryAmount: baselineStats.mean,
        threshold: baselineStats.threshold,
        message: `🚨 Unusual Spike: ₹${tx.amount.toLocaleString(
          "en-IN"
        )} spent on ${tx.category} (${pctOverAvg}% higher than your average).`,
        transaction: tx,
        timestamp: tx.timestamp,
        isDismissed: dismissedSet.has(anomalyId),
      });
    }
  });

  // 4. Scan for "48-Hour Duplicate Charge Anomalies"
  for (let i = 0; i < expenses.length; i++) {
    for (let j = i + 1; j < expenses.length; j++) {
      const t1 = expenses[i];
      const t2 = expenses[j];

      // Must have different IDs
      if (t1.id === t2.id) continue;

      // Check same amount
      if (Math.abs(t1.amount - t2.amount) < 0.01 && t1.amount >= 50) {
        // Check time delta within 48 hours (48 * 3600 * 1000 ms)
        const timeDiffMs = Math.abs(t1.timestamp - t2.timestamp);
        const hoursDiff = Math.max(1, Math.round(timeDiffMs / (1000 * 60 * 60)));

        if (timeDiffMs <= 48 * 60 * 60 * 1000) {
          // Check matching merchant / category / note
          const m1 = t1.cleanMerchant;
          const m2 = t2.cleanMerchant;
          const sameCategory = t1.category.toLowerCase() === t2.category.toLowerCase();
          const merchantMatch =
            (m1 && m2 && (m1.includes(m2) || m2.includes(m1))) ||
            (sameCategory && t1.amount >= 150);

          if (merchantMatch) {
            const pairKey = [t1.id, t2.id].sort().join("___");
            if (!processedDuplicatePairs.has(pairKey)) {
              processedDuplicatePairs.add(pairKey);

              const anomalyId = `dup_${pairKey}`;
              const merchantName = t1.merchant || t2.merchant || t1.category;

              flaggedAnomalies.push({
                id: anomalyId,
                type: "duplicate",
                severity: "high",
                title: "Possible Duplicate Charge",
                merchant: merchantName,
                category: t1.category,
                amount: t1.amount,
                date: t1.dateStr,
                hoursDiff,
                message: `🔁 Possible Duplicate Charge: ₹${t1.amount.toLocaleString("en-IN")} debited twice by ${merchantName} within ${hoursDiff} hours.`,
                transaction: t1,
                relatedTransaction: t2,
                timestamp: Math.max(t1.timestamp, t2.timestamp),
                isDismissed: dismissedSet.has(anomalyId),
              });
            }
          }
        }
      }
    }
  }

  // 5. Scan for "Recurring Monthly Subscriptions" (Same merchant + exact monthly intervals)
  const merchantGroups = {};
  expenses.forEach((t) => {
    if (t.cleanMerchant && t.cleanMerchant.length >= 3) {
      if (!merchantGroups[t.cleanMerchant]) {
        merchantGroups[t.cleanMerchant] = [];
      }
      merchantGroups[t.cleanMerchant].push(t);
    }
  });

  Object.entries(merchantGroups).forEach(([mKey, txList]) => {
    if (txList.length >= 2) {
      // Sort chronologically
      const sorted = [...txList].sort((a, b) => a.timestamp - b.timestamp);
      for (let k = 0; k < sorted.length - 1; k++) {
        const a = sorted[k];
        const b = sorted[k + 1];
        const daysApart = Math.round(Math.abs(b.timestamp - a.timestamp) / (1000 * 60 * 60 * 24));

        // ~27 to 33 days apart with same/similar amount (within 5%)
        if (daysApart >= 27 && daysApart <= 34 && Math.abs(a.amount - b.amount) / Math.max(1, a.amount) < 0.05) {
          const anomalyId = `sub_${mKey}_${b.id}`;
          const merchantName = b.merchant || a.merchant || "Subscription";

          flaggedAnomalies.push({
            id: anomalyId,
            type: "recurring_subscription",
            severity: "info",
            title: "Recurring Monthly Subscription",
            merchant: merchantName,
            category: b.category,
            amount: b.amount,
            date: b.dateStr,
            daysApart,
            message: `📅 Recurring Subscription: ₹${b.amount.toLocaleString("en-IN")} billed monthly for ${merchantName}.`,
            transaction: b,
            relatedTransaction: a,
            timestamp: b.timestamp,
            isDismissed: dismissedSet.has(anomalyId),
          });
        }
      }
    }
  });

  // Sort anomalies newest first
  flaggedAnomalies.sort((a, b) => b.timestamp - a.timestamp);

  const activeAnomalies = flaggedAnomalies.filter((a) => !a.isDismissed);
  const activeCount = activeAnomalies.length;

  let status = "clean";
  let badgeText = "Financial Health: Clean";
  let badgeColor = "emerald";

  if (activeCount > 0) {
    const hasHigh = activeAnomalies.some((a) => a.severity === "high");
    status = hasHigh ? "alert" : "warning";
    badgeText = activeCount === 1 ? "1 Anomaly Detected" : `${activeCount} Anomalies Detected`;
    badgeColor = hasHigh ? "rose" : "amber";
  }

  return {
    status,
    badgeText,
    badgeColor,
    totalAnomaliesCount: flaggedAnomalies.length,
    activeAnomaliesCount: activeCount,
    anomalies: activeAnomalies,
    allAnomalies: flaggedAnomalies,
    categoryStats,
  };
};

export default {
  detectAnomalies,
  calculateCategoryStats,
  getDismissedAnomalyIds,
  dismissAnomalyId,
  clearDismissedAnomalies,
};
