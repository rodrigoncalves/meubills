import type { Currency } from "@/data/types";

const localeByCurrency: Record<Currency, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  BTC: "pt-BR",
};

/** Formats a monetary value for the given currency. BTC uses a manual symbol. */
export function formatMoney(value: number, currency: Currency = "BRL"): string {
  if (currency === "BTC") {
    return `₿ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    })}`;
  }
  return new Intl.NumberFormat(localeByCurrency[currency], {
    style: "currency",
    currency,
  }).format(value);
}

/** Hides a value behind dots when balance visibility is off. */
export function maskMoney(visible: boolean, value: number, currency?: Currency): string {
  return visible ? formatMoney(value, currency) : "••••••";
}
