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
