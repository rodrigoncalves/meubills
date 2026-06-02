import type {
  Account,
  Category,
  CreditCard,
  FinancialGroup,
  Invoice,
  Recurrence,
  Transaction,
  TransactionType,
} from "@/data/types";

export interface AppState {
  groups: FinancialGroup[];
  accounts: Account[];
  categories: Category[];
  cards: CreditCard[];
  invoices: Invoice[];
  transactions: Transaction[];
  baseInvoiceAmounts: Record<string, number>;
  baseSummaryByGroup: Record<string, { income: number; expense: number }>;
}

/** Payload to create a transaction (pre-expansion). amount > 0. */
export interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  groupId: string;
  date: string;
  description?: string;
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  cardId?: string;
  invoiceId?: string;
  settled: boolean;
  ignored: boolean;
  recurrence: Recurrence;
  installments?: number;
}

export type AdjustMode = "create-tx" | "modify-initial";

export interface AdjustBalanceInput {
  accountId: string;
  targetBalance: number;
  mode: AdjustMode;
  description?: string;
}

export type Action =
  | { kind: "ADD_TRANSACTION"; input: NewTransactionInput }
  | { kind: "ADJUST_BALANCE"; input: AdjustBalanceInput };
