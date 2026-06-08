export type Currency = "BRL" | "USD" | "BTC";

export interface FinancialGroup {
  id: string;
  name: string;
  short: string;
  accent: string;
  currency: Currency;
}

export interface HomeSummary {
  balance: number;
  income: number;
  expense: number;
}

export interface PendingAlerts {
  pendingExpenses: { count: number; total: number };
  closedInvoices: { count: number; total: number };
}

export type InvoiceStatus = "open" | "closed" | "paid";

export interface CreditCard {
  id: string;
  groupId: string;
  name: string;
  totalLimit: number;
  invoiceAmount: number;
  /** Short closing/due date label for Home rows, e.g. "29/jun." */
  dateLabel: string;
  /** Full closing date label for invoice detail hero, e.g. "29 de jun." */
  closingLabel?: string;
  /** Full due date label for invoice detail hero, e.g. "5 de jul." */
  dueLabel?: string;
  /** Soft delete — hidden from list when true. */
  archived?: boolean;
  /** Linked account for auto-pay. */
  accountId?: string;
  /** Day of month the invoice closes (1-31). */
  closingDay?: number;
  /** Day of month the invoice is due (1-31). */
  dueDay?: number;
}

export type TransactionType = "despesa" | "receita" | "despesa-cartao" | "transferencia";

export type Recurrence = "none" | "fixed" | "monthly";

export interface Account {
  id: string;
  name: string;
  groupId: string;
  initialBalance: number;
  /** Whether this account's balance counts toward the Home "saldo atual". */
  includeInTotal: boolean;
}

export type CategoryKind = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  /** icon key understood by the icon registry */
  icon: string;
  color: string;
}

export interface Invoice {
  id: string;
  cardId: string;
  month: number; // 0-11
  year: number;
  /** Whether this invoice has been paid. */
  paid: boolean;
  /** Transaction ID of the payment (for reopen/reversal). */
  paymentTransactionId?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // always > 0
  groupId: string;
  date: string; // ISO date (yyyy-mm-dd)
  description?: string;
  categoryId?: string; // despesa/receita/despesa-cartao
  accountId?: string; // despesa/receita
  fromAccountId?: string; // transferencia
  toAccountId?: string; // transferencia
  cardId?: string; // despesa-cartao
  invoiceId?: string; // despesa-cartao
  settled: boolean; // account tx Pago/Recebido; card tx always true
  ignored: boolean;
  recurrence: Recurrence;
  installments?: number; // card expense (>= 1)
  adjustment?: boolean;
  seriesId?: string; // shared by installment / recurrence occurrences
  createdAt: string; // ISO timestamp
}

export type TransactionFilter = "all" | "despesa" | "receita" | "transferencia";
