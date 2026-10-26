import { describe, it, expect } from "vitest";
import {
  calculateLinearTrend,
  calculateWeightedMovingAverage,
  generateCashFlowForecast,
} from "../utils/ForecastEngine.js";

describe("ForecastEngine", () => {
  it("calculates linear trend correctly for steady upward slope", () => {
    // 100, 200, 300 -> next expected is 400
    const series = [100, 200, 300];
    const projected = calculateLinearTrend(series);
    expect(Math.round(projected)).toBe(400);
  });

  it("handles single-point series without error", () => {
    expect(calculateLinearTrend([500])).toBe(500);
    expect(calculateLinearTrend([])).toBe(0);
  });

  it("calculates weighted moving average giving higher weight to recent points", () => {
    // [10, 20, 30]: weights 1, 2, 3 -> (10*1 + 20*2 + 30*3)/(1+2+3) = (10 + 40 + 90)/6 = 140/6 = 23.33
    const wma = calculateWeightedMovingAverage([10, 20, 30]);
    expect(Math.round(wma * 100) / 100).toBe(23.33);
  });

  it("generates cash flow forecast data with empty transactions safely", () => {
    const result = generateCashFlowForecast([]);
    expect(result).toBeDefined();
    expect(result.hasEnoughData).toBe(false);
    expect(result.dailyBurnRate).toBe(0);
    expect(result.projectedExpense).toBe(0);
    expect(result.chartData).toEqual([]);
  });

  it("generates realistic projection from historical monthly expense data", () => {
    const sampleTxs = [
      { date: "2026-01-10", amount: 15000, type: "expense", category: "Food" },
      { date: "2026-02-15", amount: 20000, type: "expense", category: "Bills" },
      { date: "2026-03-20", amount: 25000, type: "expense", category: "Shopping" },
    ];
    const result = generateCashFlowForecast(sampleTxs);
    expect(result.hasEnoughData).toBe(true);
    expect(result.projectedExpense).toBeGreaterThan(0);
    expect(result.dailyBurnRate).toBeGreaterThan(0);
    expect(result.monthlyBreakdown.length).toBeGreaterThanOrEqual(1);
    expect(result.chartData.length).toBeGreaterThan(0);
  });
});
