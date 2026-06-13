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

/** Which occurrences of a series an edit applies to. */
export type EditScope = "one" | "future" | "all";

/** Editable fields of an existing transaction (no type/recurrence/series changes). */
export interface UpdateTransactionInput {
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  settled: boolean;
  ignored: boolean;
}

export type AdjustMode = "create-tx" | "modify-initial";

export interface AdjustBalanceInput {
  accountId: string;
  targetBalance: number;
  mode: AdjustMode;
  description?: string;
}

export interface NewCreditCardInput {
  groupId: string;
  name: string;
  totalLimit: number;
  closingDay?: number;
  dueDay?: number;
  accountId?: string;
}

export type CreditCardUpdate = Partial<
  Pick<CreditCard, "name" | "totalLimit" | "closingDay" | "dueDay" | "accountId" | "archived" | "dateLabel" | "closingLabel" | "dueLabel">
>;

export interface PayInvoiceInput {
  invoiceId: string;
  accountId: string;
  date: string;
  amount: number;
}

export type Action =
  | { kind: "ADD_TRANSACTION"; input: NewTransactionInput }
  | { kind: "UPDATE_TRANSACTION"; id: string; update: UpdateTransactionInput; scope: EditScope }
  | { kind: "ADJUST_BALANCE"; input: AdjustBalanceInput }
  | { kind: "DELETE_TRANSACTION"; id: string }
  | { kind: "ADD_CREDIT_CARD"; input: NewCreditCardInput }
  | { kind: "UPDATE_CREDIT_CARD"; cardId: string; update: CreditCardUpdate }
  | { kind: "DELETE_CREDIT_CARD"; cardId: string }
  | { kind: "PAY_INVOICE"; input: PayInvoiceInput }
  | { kind: "REOPEN_INVOICE"; invoiceId: string };
