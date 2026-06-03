import { describe, expect, it } from "vitest";
import {
  BTC_DECIMALS,
  currencySymbol,
  formatAmountOnly,
  parseAmountFromDigits,
} from "@/lib/format";

describe("parseAmountFromDigits", () => {
  it("parses fiat as cents", () => {
    expect(parseAmountFromDigits("12345", "BRL")).toBe(123.45);
    expect(parseAmountFromDigits("1", "USD")).toBe(0.01);
  });

  it("parses BTC as satoshis (8 decimals)", () => {
    expect(parseAmountFromDigits("1", "BTC")).toBe(0.00000001);
    expect(parseAmountFromDigits("100000000", "BTC")).toBe(1);
    expect(parseAmountFromDigits("150000000", "BTC")).toBe(1.5);
  });

  it("rejects BTC amounts above max", () => {
    const overMax = String(Math.round(21_000_000 * 10 ** BTC_DECIMALS) + 1);
    expect(parseAmountFromDigits(overMax, "BTC")).toBeNull();
  });
});

describe("formatAmountOnly", () => {
  it("always shows 8 decimal places for BTC", () => {
    expect(currencySymbol("BTC")).toBe("₿");
    expect(formatAmountOnly(0, "BTC")).toBe("0,00000000");
    expect(formatAmountOnly(0.5, "BTC")).toBe("0,50000000");
    expect(formatAmountOnly(1.12345678, "BTC")).toBe("1,12345678");
  });

  it("always shows 2 decimal places for BRL and USD", () => {
    expect(formatAmountOnly(0, "BRL")).toBe("0,00");
    expect(formatAmountOnly(123.4, "BRL")).toBe("123,40");
    expect(formatAmountOnly(0, "USD")).toBe("0.00");
    expect(formatAmountOnly(123.4, "USD")).toBe("123.40");
  });
});
