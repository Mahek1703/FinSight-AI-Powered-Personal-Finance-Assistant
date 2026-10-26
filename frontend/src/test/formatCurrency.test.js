import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  setUserPreferences,
  getCurrencySymbol,
  DEFAULT_CURRENCY,
} from "../config/constants.js";

describe("formatCurrency & Currency Preferences", () => {
  it("formats standard amounts with default INR preferences", () => {
    setUserPreferences({ currency: "INR", locale: "en-IN" });
    const formatted = formatCurrency(1250);
    expect(formatted).toContain("1,250");
  });

  it("handles zero and negative amounts accurately", () => {
    setUserPreferences({ currency: "INR", locale: "en-IN" });
    const zero = formatCurrency(0);
    expect(zero).toContain("0");

    const neg = formatCurrency(-500);
    expect(neg).toContain("500");
  });

  it("dynamically adapts when preferences are updated to USD", () => {
    setUserPreferences({ currency: "USD", locale: "en-US" });
    const formatted = formatCurrency(1500.5, { minimumFractionDigits: 2 });
    expect(formatted).toContain("$");
    expect(formatted).toContain("1,500.50");

    // Reset back
    setUserPreferences({ currency: DEFAULT_CURRENCY, locale: "en-IN" });
  });

  it("dynamically adapts when preferences are updated to EUR", () => {
    setUserPreferences({ currency: "EUR", locale: "de-DE" });
    const formatted = formatCurrency(99.99, { minimumFractionDigits: 2 });
    expect(formatted).toContain("€");
    expect(formatted).toContain("99,99");

    // Reset back
    setUserPreferences({ currency: DEFAULT_CURRENCY, locale: "en-IN" });
  });

  it("returns appropriate currency symbols", () => {
    expect(getCurrencySymbol("INR")).toBe("₹");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("GBP")).toBe("£");
  });
});
