import type { Account, Transaction, TransactionFilter } from "@/data/types";
import type { AppState } from "@/store/types";

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function inMonth(tx: Transaction, month: number, year: number): boolean {
  const [y, m] = tx.date.split("-").map(Number);
  return m - 1 === month && y === year;
}

export function accountBalance(state: AppState, accountId: string): number {
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  let balance = account.initialBalance;
  for (const t of state.transactions) {
    if (!t.settled || t.ignored) continue;
    if (t.accountId === accountId) {
      balance += t.type === "receita" ? t.amount : -t.amount;
    }
    if (t.type === "transferencia") {
      if (t.fromAccountId === accountId) balance -= t.amount;
      if (t.toAccountId === accountId) balance += t.amount;
    }
  }
  return round2(balance);
}

export function groupAccounts(state: AppState, groupId: string): Account[] {
  return state.accounts.filter((a) => a.groupId === groupId);
}

export function homeBalance(state: AppState, groupId: string): number {
  return round2(
    groupAccounts(state, groupId)
      .filter((a) => a.includeInTotal)
      .reduce((sum, a) => sum + accountBalance(state, a.id), 0),
  );
}

export function monthIncome(state: AppState, groupId: string, month: number, year: number): number {
  const base = state.baseSummaryByGroup[groupId]?.income ?? 0;
  const delta = state.transactions
    .filter(
      (t) =>
        t.groupId === groupId &&
        t.type === "receita" &&
        !t.ignored &&
        !t.adjustment &&
        inMonth(t, month, year),
    )
    .reduce((sum, t) => sum + t.amount, 0);
  return round2(base + delta);
}

export function monthExpense(
  state: AppState,
  groupId: string,
  month: number,
  year: number,
): number {
  const base = state.baseSummaryByGroup[groupId]?.expense ?? 0;
  const delta = state.transactions
    .filter(
      (t) =>
        t.groupId === groupId &&
        (t.type === "despesa" || t.type === "despesa-cartao") &&
        !t.ignored &&
        !t.adjustment &&
        inMonth(t, month, year),
    )
    .reduce((sum, t) => sum + t.amount, 0);
  return round2(base + delta);
}

export function invoiceAmount(state: AppState, invoiceId: string): number {
  const base = state.baseInvoiceAmounts[invoiceId] ?? 0;
  const delta = state.transactions
    .filter((t) => t.type === "despesa-cartao" && t.invoiceId === invoiceId && !t.ignored)
    .reduce((sum, t) => sum + t.amount, 0);
  return round2(base + delta);
}

export function invoiceLabel(month: number, year: number): string {
  return `Fatura de ${MONTHS_PT[month]} de ${year}`;
}

export function cardInvoices(state: AppState, cardId: string) {
  return state.invoices
    .filter((inv) => inv.cardId === cardId)
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

export function groupTransactions(
  state: AppState,
  groupId: string,
  month: number,
  year: number,
  filter: TransactionFilter,
): Transaction[] {
  const matchesFilter = (t: Transaction): boolean => {
    switch (filter) {
      case "all":
        return true;
      case "despesa":
        return t.type === "despesa" || t.type === "despesa-cartao";
      case "receita":
        return t.type === "receita";
      case "transferencia":
        return t.type === "transferencia";
    }
  };
  return state.transactions
    .filter((t) => t.groupId === groupId && inMonth(t, month, year) && matchesFilter(t))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
