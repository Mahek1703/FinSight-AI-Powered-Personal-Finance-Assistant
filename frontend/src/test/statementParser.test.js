import { describe, it, expect } from "vitest";
import {
  validateStatementFile,
  autoCategorize,
  cleanMerchantNote,
  normalizeDate,
  parseCSV,
} from "../utils/statementParser.js";

describe("statementParser", () => {
  it("validates statement file formats strictly and rejects images", () => {
    const validFile = new File(["dummy,csv,content"], "statement.csv", { type: "text/csv" });
    const validation = validateStatementFile(validFile);
    expect(validation.valid).toBe(true);

    const imageFile = new File(["dummy"], "receipt.png", { type: "image/png" });
    const imageValidation = validateStatementFile(imageFile);
    expect(imageValidation.valid).toBe(false);
    expect(imageValidation.error).toContain("Image files are not supported");
  });

  it("categorizes transactions accurately from narration keywords", () => {
    expect(autoCategorize("Swiggy Order #123", "", "Expense")).toBe("Food");
    expect(autoCategorize("Uber Ride Downtown", "", "Expense")).toBe("Travel");
    expect(autoCategorize("Apollo Pharmacy Meds", "", "Expense")).toBe("Health");
    expect(autoCategorize("Airtel Broadband Bill", "", "Expense")).toBe("Bills");
    expect(autoCategorize("Monthly Salary Credit", "", "Income")).toBe("Salary");
    expect(autoCategorize("Mutual Fund Dividend", "", "Income")).toBe("Investment");
  });

  it("cleans merchant note by stripping transaction IDs and junk suffixes", () => {
    const cleaned = cleanMerchantNote("POS SWIGGY 12345678 BANGALORE IN");
    expect(cleaned).toContain("Swiggy");
  });

  it("normalizes date strings across standard formats into YYYY-MM-DD", () => {
    expect(normalizeDate("2026-03-15")).toBe("2026-03-15");
    expect(normalizeDate("15/03/2026")).toBe("2026-03-15");
    expect(normalizeDate("15-03-2026")).toBe("2026-03-15");
  });

  it("parses CSV statement file content into standardized transaction array", async () => {
    const csvContent = `Date,Description,Amount,Type
2026-03-01,Zomato Delivery,340,Expense
2026-03-05,Monthly Salary,75000,Income
2026-03-10,Uber Trip,450,Expense`;

    const file = new File([csvContent], "sample.csv", { type: "text/csv" });
    const parsed = await parseCSV(file);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);
    expect(parsed[0].amount).toBe(340);
    expect(parsed[0].category).toBe("Food");
    expect(parsed[1].type).toBe("Income");
  });
});
