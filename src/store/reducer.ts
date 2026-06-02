import {
  ADJUST_EXPENSE_CATEGORY,
  ADJUST_INCOME_CATEGORY,
  accounts as seedAccounts,
  baseInvoiceAmounts,
  baseSummaryByGroup,
  cards as seedCards,
  categories as seedCategories,
  groups as seedGroups,
  invoices as seedInvoices,
} from "@/data/mock";
import type { Transaction } from "@/data/types";
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
    case "ADJUST_BALANCE": {
      const { accountId, targetBalance, mode, description } = action.input;
      const current = accountBalance(state, accountId);
      const diff = Math.round((targetBalance - current) * 100) / 100;
      if (diff === 0) return state;

      if (mode === "modify-initial") {
        return {
          ...state,
          accounts: state.accounts.map((a) =>
            a.id === accountId
              ? { ...a, initialBalance: Math.round((a.initialBalance + diff) * 100) / 100 }
              : a,
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
    default:
      return state;
  }
}
