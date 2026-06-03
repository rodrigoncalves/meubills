import type {
  Account,
  Category,
  CreditCard,
  FinancialGroup,
  HomeSummary,
  Invoice,
  PendingAlerts,
} from "./types";

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

/** Month/year the seeded base summary applies to (June 2026). */
export const SEED_MONTH = 5;
export const SEED_YEAR = 2026;

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
    groupId: "pf",
    name: "C6 Bank",
    availableLimit: 7528.0,
    invoiceAmount: 2471.0,
    dateLabel: "29/jun.",
    closingLabel: "29 de jun.",
    dueLabel: "5 de jul.",
    status: "open",
  },
  {
    id: "mp",
    groupId: "pf",
    name: "Mercado Pago",
    availableLimit: 1240.18,
    invoiceAmount: 259.18,
    dateLabel: "05/jun.",
    closingLabel: "29 de mai.",
    dueLabel: "5 de jun.",
    status: "closed-paid",
  },
  {
    id: "nu",
    groupId: "pf",
    name: "Nubank",
    availableLimit: 3254.99,
    invoiceAmount: 745.01,
    dateLabel: "25/jun.",
    closingLabel: "25 de jun.",
    dueLabel: "2 de jul.",
    status: "open",
  },
  {
    id: "will",
    groupId: "pf",
    name: "Will Bank",
    availableLimit: 0,
    invoiceAmount: 1832.45,
    dateLabel: "05/jun.",
    closingLabel: "29 de mai.",
    dueLabel: "5 de jun.",
    status: "closed-pending",
  },
];

export const cards: CreditCard[] = [...cardList].sort((a, b) =>
  a.name.localeCompare(b.name, "pt-BR"),
);

export const accounts: Account[] = [
  // PF — included accounts sum to 1164.00 (current Home "saldo atual").
  { id: "pf-cc", name: "Conta Corrente", groupId: "pf", initialBalance: 900, includeInTotal: true },
  { id: "pf-wallet", name: "Carteira", groupId: "pf", initialBalance: 264, includeInTotal: true },
  { id: "pf-poup", name: "Poupança", groupId: "pf", initialBalance: 5000, includeInTotal: false },
  { id: "pj-cc", name: "Conta PJ", groupId: "pj", initialBalance: 3000, includeInTotal: true },
  {
    id: "usd-wallet",
    name: "USD Wallet",
    groupId: "usd",
    initialBalance: 1200,
    includeInTotal: true,
  },
  { id: "btc-cold", name: "BTC Cold", groupId: "btc", initialBalance: 0.5, includeInTotal: true },
];

export const ADJUST_EXPENSE_CATEGORY = "cat-ajuste-exp";
export const ADJUST_INCOME_CATEGORY = "cat-ajuste-inc";
export const DEFAULT_EXPENSE_CATEGORY = "cat-despesa-comum";

export const categories: Category[] = [
  {
    id: "cat-despesa-comum",
    name: "Despesa comum",
    kind: "expense",
    icon: "tag",
    color: "rgb(229, 72, 77)",
  },
  { id: "cat-casa", name: "Casa", kind: "expense", icon: "home", color: "rgb(245, 184, 66)" },
  {
    id: "cat-alimentacao",
    name: "Alimentação",
    kind: "expense",
    icon: "food",
    color: "rgb(108, 35, 224)",
  },
  {
    id: "cat-transporte",
    name: "Transporte",
    kind: "expense",
    icon: "car",
    color: "rgb(54, 211, 93)",
  },
  {
    id: "cat-receita-comum",
    name: "Receita comum",
    kind: "income",
    icon: "tag",
    color: "rgb(43, 174, 163)",
  },
  { id: "cat-salario", name: "Salário", kind: "income", icon: "cash", color: "rgb(43, 174, 163)" },
  {
    id: ADJUST_EXPENSE_CATEGORY,
    name: "Ajuste",
    kind: "expense",
    icon: "adjust",
    color: "rgb(125, 125, 134)",
  },
  {
    id: ADJUST_INCOME_CATEGORY,
    name: "Ajuste",
    kind: "income",
    icon: "adjust",
    color: "rgb(125, 125, 134)",
  },
];

export const invoices: Invoice[] = [
  { id: "inv-c6-jun", cardId: "c6", month: 5, year: 2026, status: "open" },
  { id: "inv-c6-jul", cardId: "c6", month: 6, year: 2026, status: "open" },
  { id: "inv-mp-jun", cardId: "mp", month: 5, year: 2026, status: "closed-paid" },
  { id: "inv-nu-jun", cardId: "nu", month: 5, year: 2026, status: "open" },
  { id: "inv-nu-jul", cardId: "nu", month: 6, year: 2026, status: "open" },
  { id: "inv-will-jun", cardId: "will", month: 5, year: 2026, status: "closed-pending" },
];

/** Seeded invoice totals (base the store applies card-expense deltas on top of). */
export const baseInvoiceAmounts: Record<string, number> = {
  "inv-c6-jun": 2471.0,
  "inv-mp-jun": 259.18,
  "inv-nu-jun": 745.01,
  "inv-will-jun": 1832.45,
};

/** Seeded month income/expense per group for SEED_MONTH/SEED_YEAR. */
export const baseSummaryByGroup: Record<string, { income: number; expense: number }> = {
  pf: { income: 17037.36, expense: 31568.29 },
};
