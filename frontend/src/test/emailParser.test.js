import { describe, it, expect } from "vitest";
import {
  cleanAmount,
  extractAmountFromText,
  identifyVendorAndCategory,
  parseEmailPayload,
} from "../utils/emailParser.js";

describe("emailParser", () => {
  it("cleans and normalizes monetary strings with various currency symbols and commas", () => {
    expect(cleanAmount("₹1,499.00")).toBe(1499);
    expect(cleanAmount("$45.50")).toBe(45.5);
    expect(cleanAmount("EUR 120,500")).toBe(120500);
    expect(cleanAmount("invalid")).toBe(0);
  });

  it("extracts amounts from typical email receipt text bodies", () => {
    const text1 = "Thank you for your order. Order Total: INR 2,499.00 debited from card ending in 4111";
    expect(extractAmountFromText(text1)).toBe(2499);

    const text2 = "Your food order has been placed! Total Amount: ₹380 paid via UPI.";
    expect(extractAmountFromText(text2)).toBe(380);
  });

  it("identifies merchant vendor and maps to correct category", () => {
    const res1 = identifyVendorAndCategory("auto-confirm@amazon.in", "Your Amazon.in order has shipped", "Order details");
    expect(res1.vendor).toBe("Amazon");
    expect(res1.category).toBe("Shopping");

    const res2 = identifyVendorAndCategory("no-reply@swiggy.in", "Order delivered", "Your meal is here");
    expect(res2.vendor).toBe("Swiggy");
    expect(res2.category).toBe("Food");
  });

  it("parses pre-structured backend JSON payload cleanly", () => {
    const payload = {
      amount: "1299.00",
      merchant: "Myntra",
      description: "Sneakers order",
      date: "2026-03-10",
      account: "Card",
    };

    const parsed = parseEmailPayload(payload);
    expect(parsed).toBeDefined();
    expect(parsed.amount).toBe(1299);
    expect(parsed.category).toBe("Shopping");
    expect(parsed.merchant).toBe("Myntra");
  });
});
