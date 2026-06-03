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

export type InvoiceStatus = "open" | "closed-pending" | "closed-paid";

export interface CreditCard {
  id: string;
  name: string;
  availableLimit: number;
  invoiceAmount: number;
  /** day/month short label, e.g. "29/jun." */
  dateLabel: string;
  status: InvoiceStatus;
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
  status: InvoiceStatus;
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
