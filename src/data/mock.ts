import type { CreditCard, FinancialGroup, HomeSummary, PendingAlerts } from "./types";

export const groups: FinancialGroup[] = [
  { id: "pf", name: "Pessoal", short: "PF", accent: "rgb(108, 35, 224)", currency: "BRL" },
  { id: "pj", name: "Empresa", short: "PJ", accent: "rgb(43, 174, 163)", currency: "BRL" },
  { id: "usd", name: "Dólar", short: "USD", accent: "rgb(54, 211, 93)", currency: "USD" },
  { id: "btc", name: "Bitcoin", short: "BTC", accent: "rgb(245, 184, 66)", currency: "BTC" },
];

export const activeGroupId = "pf";

/** Consolidado is a special selector view, not a persisted group. */
export const consolidated: FinancialGroup = {
  id: "consolidado",
  name: "Consolidado",
  short: "∑",
  accent: "rgb(125, 125, 134)",
  currency: "BRL",
};

/** Resolves any selection id (group or consolidado) to a displayable group. */
export function resolveGroup(id: string): FinancialGroup {
  if (id === consolidated.id) return consolidated;
  return groups.find((g) => g.id === id) ?? groups[0];
}

export const currentMonth = "Junho";

export const summary: HomeSummary = {
  balance: 1164.0,
  income: 17037.36,
  expense: 31568.29,
};

export const alerts: PendingAlerts = {
  pendingExpenses: { count: 8, total: 5372.32 },
  closedInvoices: { count: 2, total: 9887.32 },
};

/** Sorted alphabetically by displayed name (per DESIGN.md). */
const cardList: CreditCard[] = [
  {
    id: "c6",
    name: "C6 Bank",
    availableLimit: 7528.0,
    invoiceAmount: 2471.0,
    dateLabel: "29/jun.",
    status: "open",
  },
  {
    id: "mp",
    name: "Mercado Pago",
    availableLimit: 1240.18,
    invoiceAmount: 259.18,
    dateLabel: "05/jun.",
    status: "closed-paid",
  },
  {
    id: "nu",
    name: "Nubank",
    availableLimit: 3254.99,
    invoiceAmount: 745.01,
    dateLabel: "25/jun.",
    status: "open",
  },
  {
    id: "will",
    name: "Will Bank",
    availableLimit: 0,
    invoiceAmount: 1832.45,
    dateLabel: "05/jun.",
    status: "closed-pending",
  },
];

export const cards: CreditCard[] = [...cardList].sort((a, b) =>
  a.name.localeCompare(b.name, "pt-BR"),
);
