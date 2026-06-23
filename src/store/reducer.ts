import {
  ADJUST_EXPENSE_CATEGORY,
  ADJUST_INCOME_CATEGORY,
  baseInvoiceAmounts,
  baseSummaryByGroup,
  DEFAULT_EXPENSE_CATEGORY,
  accounts as seedAccounts,
  cards as seedCards,
  categories as seedCategories,
  groups as seedGroups,
  invoices as seedInvoices,
} from "@/data/mock";
import type { Transaction } from "@/data/types";
import { formatClosingLabel, formatDateLabel, formatDueLabel, generateInvoices } from "@/lib/card-utils";
import { expandInstallments, expandRecurrence } from "@/store/expand";
import { accountBalance } from "@/store/selectors";
import type { Action, AppState, NewTransactionInput } from "@/store/types";

export function buildInitialState(): AppState {
  return {
    groups: seedGroups,
    accounts: seedAccounts.map((a) => ({ ...a })),
    categories: seedCategories,
    cards: seedCards,
    invoices: seedInvoices,
    transactions: [],
    baseInvoiceAmounts: { ...baseInvoiceAmounts },
    baseSummaryByGroup: { ...baseSummaryByGroup },
  };
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function materialize(input: NewTransactionInput): Transaction {
  return {
    ...input,
    id: nextId("tx"),
    createdAt: new Date().toISOString(),
  };
}

function expand(tx: Transaction, state: AppState): Transaction[] {
  if (tx.type === "despesa-cartao") return expandInstallments(tx, state.invoices);
  if (tx.type === "despesa") return expandRecurrence(tx);
  return [{ ...tx }];
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.kind) {
    case "ADD_TRANSACTION": {
      const tx = materialize(action.input);
      return { ...state, transactions: [...state.transactions, ...expand(tx, state)] };
    }
    case "UPDATE_TRANSACTION": {
      const { id, update, scope } = action;
      const target = state.transactions.find((t) => t.id === id);
      if (!target) return state;

      // Fields propagated to OTHER occurrences of the series.
      // date and settled stay per-occurrence; they only change on the target.
      const template = {
        amount: update.amount,
        description: update.description,
        categoryId: update.categoryId,
        accountId: update.accountId,
        fromAccountId: update.fromAccountId,
        toAccountId: update.toAccountId,
        ignored: update.ignored,
      };

      // Single-occurrence edit (no series, or "one" chosen): apply everything.
      if (scope === "one" || !target.seriesId) {
        return {
          ...state,
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...update } : t)),
        };
      }

      const { seriesId } = target;
      const boundary = target.date; // original date — "future" = this one and later

      return {
        ...state,
        transactions: state.transactions.map((t) => {
          if (t.seriesId !== seriesId) return t;
          if (t.id === id) return { ...t, ...update };
          if (scope === "future" && t.date < boundary) return t;
          return { ...t, ...template };
        }),
      };
    }
    case "ADJUST_BALANCE": {
      const { accountId, targetBalance, mode, description } = action.input;
      const current = accountBalance(state, accountId);
      const diff = Math.round((targetBalance - current) * 100) / 100;
      if (diff === 0) return state;

      if (mode === "modify-initial") {
        return {
          ...state,
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, initialBalance: Math.round((a.initialBalance + diff) * 100) / 100 } : a,
          ),
        };
      }

      const account = state.accounts.find((a) => a.id === accountId);
      const isIncome = diff > 0;
      const adjustment: Transaction = {
        id: nextId("adj"),
        type: isIncome ? "receita" : "despesa",
        amount: Math.abs(diff),
        groupId: account?.groupId ?? "pf",
        date: new Date().toISOString().slice(0, 10),
        description,
        categoryId: isIncome ? ADJUST_INCOME_CATEGORY : ADJUST_EXPENSE_CATEGORY,
        accountId,
        settled: true,
        ignored: false,
        recurrence: "none",
        adjustment: true,
        createdAt: new Date().toISOString(),
      };
      return { ...state, transactions: [...state.transactions, adjustment] };
    }
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.id),
      };
    case "ADD_ACCOUNT": {
      const id = nextId("acc");
      return {
        ...state,
        accounts: [...state.accounts, { ...action.account, id }],
      };
    }
    case "UPDATE_ACCOUNT": {
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.accountId ? { ...a, ...action.update } : a)),
      };
    }
    case "ADD_CREDIT_CARD": {
      const id = nextId("card");
      const today = new Date();
      const card = {
        id,
        groupId: action.input.groupId,
        name: action.input.name,
        totalLimit: action.input.totalLimit,
        invoiceAmount: 0,
        dateLabel: action.input.closingDay ? formatDateLabel(action.input.closingDay) : "",
        closingLabel: action.input.closingDay ? formatClosingLabel(action.input.closingDay) : undefined,
        dueLabel: action.input.dueDay ? formatDueLabel(action.input.dueDay) : undefined,
        closingDay: action.input.closingDay,
        dueDay: action.input.dueDay,
        accountId: action.input.accountId,
      };
      const invoices = generateInvoices(id, today.getMonth(), today.getFullYear(), 6);
      return {
        ...state,
        cards: [...state.cards, card],
        invoices: [...state.invoices, ...invoices],
      };
    }
    case "UPDATE_CREDIT_CARD": {
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.cardId ? { ...c, ...action.update } : c)),
      };
    }
    case "PAY_INVOICE": {
      const { invoiceId, accountId, date, amount } = action.input;
      const invoice = state.invoices.find((inv) => inv.id === invoiceId);
      if (!invoice || invoice.paid) return state;
      const txId = nextId("pay");
      const payment: Transaction = {
        id: txId,
        type: "despesa",
        amount,
        groupId: state.cards.find((c) => c.id === invoice.cardId)?.groupId ?? "pf",
        date,
        description: "Pagamento de fatura",
        categoryId: DEFAULT_EXPENSE_CATEGORY,
        accountId,
        settled: true,
        ignored: false,
        recurrence: "none",
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        transactions: [...state.transactions, payment],
        invoices: state.invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, paid: true, paymentTransactionId: txId } : inv,
        ),
      };
    }
    case "REOPEN_INVOICE": {
      const inv = state.invoices.find((i) => i.id === action.invoiceId);
      if (!inv || !inv.paid || !inv.paymentTransactionId) return state;
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== inv.paymentTransactionId),
        invoices: state.invoices.map((i) =>
          i.id === action.invoiceId ? { ...i, paid: false, paymentTransactionId: undefined } : i,
        ),
      };
    }
    case "DELETE_CREDIT_CARD": {
      const { cardId } = action;
      const invoiceIds = state.invoices.filter((inv) => inv.cardId === cardId).map((inv) => inv.id);
      const updatedBase = { ...state.baseInvoiceAmounts };
      for (const invId of invoiceIds) {
        delete updatedBase[invId];
      }
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== cardId),
        invoices: state.invoices.filter((inv) => inv.cardId !== cardId),
        transactions: state.transactions.filter((t) => t.cardId !== cardId),
        baseInvoiceAmounts: updatedBase,
      };
    }
    default:
      return state;
  }
}
