import { describe, expect, it } from "vitest";
import {
  formatClosingLabel,
  formatDateLabel,
  formatDateLong,
  formatDueLabel,
  formatShortDate,
  generateInvoices,
  getInvoiceStatus,
} from "@/lib/card-utils";

describe("formatDateLabel", () => {
  it("formats day with full month (no zero-pad, no year)", () => {
    // month=5 = June → "junho"
    expect(formatDateLabel(29, 5)).toBe("29 de junho");
  });

  it("does not zero-pad single-digit days", () => {
    expect(formatDateLabel(5, 5)).toBe("5 de junho");
  });
});

describe("formatClosingLabel", () => {
  it("formats closing label with full month", () => {
    // month=5 = June → "junho"
    expect(formatClosingLabel(29, 5)).toBe("29 de junho");
  });

  it("formats without zero-padding", () => {
    expect(formatClosingLabel(1, 0)).toBe("1 de janeiro");
  });
});

describe("formatDueLabel", () => {
  it("defaults to month after closing month", () => {
    // closingMonth=5 (June) → due month=6 (July) → "julho"
    expect(formatDueLabel(5, 5)).toBe("5 de julho");
  });

  it("wraps to january when closing is december", () => {
    expect(formatDueLabel(10, 11)).toBe("10 de janeiro");
  });
});

describe("formatDateLong", () => {
  it("formats day, month, and year in cursive", () => {
    // month=5 = June → "junho"
    expect(formatDateLong(2, 5, 2026)).toBe("2 de junho de 2026");
  });

  it("does not zero-pad single-digit days", () => {
    expect(formatDateLong(9, 0, 2026)).toBe("9 de janeiro de 2026");
  });
});

describe("formatShortDate", () => {
  it("parses ISO date to cursive format", () => {
    expect(formatShortDate("2026-06-03")).toBe("3 de junho de 2026");
  });

  it("handles double-digit days", () => {
    expect(formatShortDate("2026-12-15")).toBe("15 de dezembro de 2026");
  });
});

describe("generateInvoices", () => {
  it("generates N consecutive monthly invoices", () => {
    const invoices = generateInvoices("test-card", 0, 2026, 3);
    expect(invoices).toHaveLength(3);

    // First invoice: January 2026
    expect(invoices[0].cardId).toBe("test-card");
    expect(invoices[0].month).toBe(0);
    expect(invoices[0].year).toBe(2026);
    expect(invoices[0].paid).toBe(false);
    expect(invoices[0].id).toContain("test-card");

    // Second: February 2026
    expect(invoices[1].month).toBe(1);
    expect(invoices[1].year).toBe(2026);

    // Third: March 2026
    expect(invoices[2].month).toBe(2);
    expect(invoices[2].year).toBe(2026);
  });

  it("wraps year correctly", () => {
    const invoices = generateInvoices("card", 11, 2026, 2); // Dec 2026 + Jan 2027
    expect(invoices).toHaveLength(2);
    expect(invoices[0].month).toBe(11);
    expect(invoices[0].year).toBe(2026);
    expect(invoices[1].month).toBe(0);
    expect(invoices[1].year).toBe(2027);
  });

  it("generates unique IDs", () => {
    const invoices = generateInvoices("abc", 0, 2026, 2);
    expect(invoices[0].id).not.toBe(invoices[1].id);
  });

  it("returns empty array for count=0", () => {
    const invoices = generateInvoices("card", 0, 2026, 0);
    expect(invoices).toHaveLength(0);
  });
});

describe("getInvoiceStatus", () => {
  it("returns 'paid' when invoice is paid", () => {
    const inv = { month: 5, year: 2026, paid: true };
    expect(getInvoiceStatus(inv, 29)).toBe("paid");
  });

  it("returns 'open' for current month before closing day", () => {
    const today = new Date();
    const inv = { month: today.getMonth(), year: today.getFullYear(), paid: false };
    expect(getInvoiceStatus(inv, 31)).toBe("open"); // closing day 31 → always open
  });

  it("returns 'closed' for past month", () => {
    const today = new Date();
    const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
    const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const inv = { month: prevMonth, year: prevYear, paid: false };
    expect(getInvoiceStatus(inv, 29)).toBe("closed");
  });

  it("returns 'closed' for current month after closing day", () => {
    const today = new Date();
    const inv = { month: today.getMonth(), year: today.getFullYear(), paid: false };
    expect(getInvoiceStatus(inv, 1)).toBe("closed"); // closing day 1 → already passed
  });
});
