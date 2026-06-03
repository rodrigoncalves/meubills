import type { Currency } from "@/data/types";

const localeByCurrency: Record<Currency, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  BTC: "pt-BR",
};

/** Upper bound for transaction / balance-adjust amounts (fiat cents entry). */
export const MAX_TRANSACTION_AMOUNT = 99_999_999.99;

const MAX_TRANSACTION_CENTS = Math.round(MAX_TRANSACTION_AMOUNT * 100);

export const BTC_DECIMALS = 8;
export const FIAT_DECIMALS = 2;
const MAX_BTC_AMOUNT = 21_000_000;
const MAX_BTC_SATOSHIS = Math.round(MAX_BTC_AMOUNT * 10 ** BTC_DECIMALS);

/**
 * Parses keypad digits into an amount.
 * Fiat: digits are cents (2 decimal places). BTC: digits are satoshis (8 decimal places).
 * Returns `null` when the value would exceed the currency max so the caller can keep the previous amount.
 */
export function parseAmountFromDigits(digits: string, currency: Currency = "BRL"): number | null {
  if (digits === "") return 0;
  if (currency === "BTC") {
    const satoshis = Number.parseInt(digits, 10);
    if (satoshis > MAX_BTC_SATOSHIS) return null;
    return satoshis / 10 ** BTC_DECIMALS;
  }
  const cents = Number.parseInt(digits, 10);
  if (cents > MAX_TRANSACTION_CENTS) return null;
  return cents / 100;
}

/** Currency symbol for display beside an amount field (no trailing space). */
export function currencySymbol(currency: Currency): string {
  if (currency === "BTC") return "₿";
  return (
    new Intl.NumberFormat(localeByCurrency[currency], {
      style: "currency",
      currency,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

function fractionDigitsFor(currency: Currency): number {
  return currency === "BTC" ? BTC_DECIMALS : FIAT_DECIMALS;
}

/** Numeric portion of a monetary value (locale grouping/decimals, no symbol). */
export function formatAmountOnly(value: number, currency: Currency = "BRL"): string {
  const decimals = fractionDigitsFor(currency);
  return value.toLocaleString(localeByCurrency[currency], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Formats a monetary value for the given currency. BTC uses a manual symbol. */
export function formatMoney(value: number, currency: Currency = "BRL"): string {
  if (currency === "BTC") {
    return `₿ ${formatAmountOnly(value, currency)}`;
  }
  const decimals = FIAT_DECIMALS;
  return new Intl.NumberFormat(localeByCurrency[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Hides a value behind dots when balance visibility is off. */
export function maskMoney(visible: boolean, value: number, currency?: Currency): string {
  return visible ? formatMoney(value, currency) : "••••••";
}
