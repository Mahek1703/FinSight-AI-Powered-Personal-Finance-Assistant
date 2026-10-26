import { describe, it, expect } from "vitest";
import {
  normalizeReceiptCategory,
  normalizePaymentType,
} from "../services/geminiVision.service.js";
import {
  normalizeVoiceCategory,
  normalizeVoiceAccountType,
} from "../services/geminiVoice.service.js";

describe("Category & Account Normalization", () => {
  describe("Receipt OCR Normalization", () => {
    it("maps raw receipt categories to standard taxonomy", () => {
      expect(normalizeReceiptCategory("Restaurant Dinner")).toBe("Food");
      expect(normalizeReceiptCategory("Supermarket Groceries")).toBe("Food");
      expect(normalizeReceiptCategory("Electricity bill")).toBe("Bills");
      expect(normalizeReceiptCategory("Zara Clothing")).toBe("Shopping");
      expect(normalizeReceiptCategory("Petrol Fuel pump")).toBe("Travel");
      expect(normalizeReceiptCategory("Apollo Pharmacy Meds")).toBe("Health");
      expect(normalizeReceiptCategory("Random unmapped text")).toBe("Others");
    });

    it("normalizes payment types accurately", () => {
      expect(normalizePaymentType("Cash")).toBe("Cash");
      expect(normalizePaymentType("Credit Card")).toBe("Credit");
      expect(normalizePaymentType("Debit Card")).toBe("Debit");
      expect(normalizePaymentType("GPay UPI")).toBe("Online");
    });
  });

  describe("Voice Input Normalization", () => {
    it("maps transcribed voice categories accurately", () => {
      expect(normalizeVoiceCategory("Food", "paid 200 for lunch")).toBe("Food");
      expect(normalizeVoiceCategory("Travel", "paid 150 for uber")).toBe("Travel");
      expect(normalizeVoiceCategory("Bills", "paid electricity recharge")).toBe("Bills");
    });

    it("normalizes voice account types to standard wallets", () => {
      expect(normalizeVoiceAccountType("cash", "paid in cash")).toBe("Cash");
      expect(normalizeVoiceAccountType("online", "paid via gpay")).toBe("Online");
      expect(normalizeVoiceAccountType("bank", "transferred from hdfc")).toBe("Bank");
    });
  });
});
