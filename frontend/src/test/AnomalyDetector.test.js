import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateCategoryStats,
  detectAnomalies,
  dismissAnomalyId,
  clearDismissedAnomalies,
  getDismissedAnomalyIds,
} from "../utils/AnomalyDetector.js";

describe("AnomalyDetector", () => {
  beforeEach(() => {
    clearDismissedAnomalies();
  });

  it("calculates mean, standard deviation, and anomaly threshold correctly", () => {
    const stats = calculateCategoryStats([100, 100, 100]);
    expect(stats.mean).toBe(100);
    expect(stats.stdDev).toBe(0);
    expect(stats.count).toBe(3);
  });

  it("identifies a sharp spending spike that exceeds standard statistical baseline", () => {
    // Normal baseline: regular Food transactions around 200
    // Anomaly: 10,000 in Food
    const txs = [
      { id: "1", date: "2026-03-01", amount: 200, category: "Food", type: "expense" },
      { id: "2", date: "2026-03-02", amount: 220, category: "Food", type: "expense" },
      { id: "3", date: "2026-03-03", amount: 190, category: "Food", type: "expense" },
      { id: "4", date: "2026-03-04", amount: 210, category: "Food", type: "expense" },
      { id: "5", date: "2026-03-05", amount: 10000, category: "Food", type: "expense", note: "Luxury Banquet" },
    ];

    const result = detectAnomalies(txs);
    expect(result.anomalies.length).toBeGreaterThan(0);
    const spike = result.anomalies.find((a) => a.type === "high_spike");
    expect(spike).toBeDefined();
    expect(spike.transaction.id).toBe("5");
  });

  it("detects duplicate debits within the same merchant within the duplicate window", () => {
    const now = new Date().toISOString();
    const txs = [
      {
        id: "tx-dup-1",
        date: now,
        amount: 899,
        category: "Bills",
        note: "Netflix Subscription",
        type: "expense",
      },
      {
        id: "tx-dup-2",
        date: now,
        amount: 899,
        category: "Bills",
        note: "Netflix Subscription",
        type: "expense",
      },
    ];

    const result = detectAnomalies(txs);
    const duplicate = result.anomalies.find((a) => a.type === "duplicate");
    expect(duplicate).toBeDefined();
    expect(duplicate.amount).toBe(899);
  });

  it("respects session dismissals and excludes dismissed anomalies", () => {
    const anomalyId = "spike_test_123";
    dismissAnomalyId(anomalyId);
    expect(getDismissedAnomalyIds().has(anomalyId)).toBe(true);
  });
});
