# Transaction Form, Balance Adjustment, Accounts & Transactions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four-type transaction creation flow, a minimal Accounts screen with balance adjustment ("Reajuste de saldo"), and a minimal Transactions screen, all backed by an in-memory store so balances react to user input.

**Architecture:** A React context + `useReducer` store is the single source of truth for accounts, categories, cards, invoices, and transactions. Pure selectors derive Home balance from accounts and derive month income/expense and card invoice amounts as `seed base + deltas`. UI reads the store through hooks; the transaction form renders full-screen on mobile and as a centered modal on desktop.

**Tech Stack:** React 18, TypeScript (strict), Vite, Biome, Vitest (added in Task 1).

**Reference:** `docs/superpowers/specs/2026-06-02-transaction-form-design.md`

---

## File Structure

Created:

- `vitest.config.ts` — test runner config (jsdom not needed; pure-logic tests).
- `src/store/types.ts` — `AppState`, `Action` types.
- `src/store/expand.ts` — pure expansion of installments / recurrence.
- `src/store/reducer.ts` — `appReducer`, initial state builder.
- `src/store/selectors.ts` — pure derived-data selectors.
- `src/store/AppStateProvider.tsx` — context provider + `useAppState` / `useAppDispatch` hooks.
- `src/store/__tests__/expand.test.ts`
- `src/store/__tests__/selectors.test.ts`
- `src/store/__tests__/reducer.test.ts`
- `src/components/Presentation.tsx` + `.css` — mobile full-screen / desktop modal wrapper.
- `src/components/PickerSheet.tsx` + `.css` — shared selector list (group/category/account/card/invoice).
- `src/components/Toast.tsx` + `.css` + `ToastProvider`.
- `src/components/form/AmountInput.tsx` + `.css`.
- `src/components/form/TypeSwitcher.tsx` + `.css`.
- `src/screens/transaction/TransactionForm.tsx` + `.css`.
- `src/screens/accounts/AccountsScreen.tsx` + `.css`.
- `src/screens/accounts/AccountSheet.tsx`.
- `src/screens/accounts/BalanceAdjustSheet.tsx` + `.css`.
- `src/screens/transactions/TransactionsScreen.tsx` + `.css`.
- `src/screens/transactions/TypeFilterMenu.tsx`.

Modified:

- `package.json` — add Vitest deps + scripts.
- `src/data/types.ts` — new domain types.
- `src/data/mock.ts` — seed accounts, categories, invoices, base maps.
- `src/App.tsx` — wrap in providers, wire form/screens/nav.
- `src/screens/home/Hero.tsx`, `src/screens/dashboard/SummaryCards.tsx` — read derived balance.

---

## Task 1: Test infrastructure (Vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add Vitest dev dependency**

Run: `npm install -D vitest@^2.1.8`
Expected: `vitest` added to `devDependencies`, lockfile updated.

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Create a temporary smoke test to verify the runner**

Create `src/store/__tests__/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/store/__tests__/smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Domain types

**Files:**
- Modify: `src/data/types.ts`

- [ ] **Step 1: Append the new domain types**

Add to the end of `src/data/types.ts`:

```ts
export type TransactionType =
  | "despesa"
  | "receita"
  | "despesa-cartao"
  | "transferencia";

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

export type TransactionFilter =
  | "all"
  | "despesa"
  | "receita"
  | "transferencia";
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: add transaction domain types"
```

---

## Task 3: Seed data

**Files:**
- Modify: `src/data/mock.ts`

PF accounts flagged `includeInTotal` must sum to `1164.00` so the derived Home balance matches the current visual.

- [ ] **Step 1: Import the new types**

At the top of `src/data/mock.ts`, extend the existing type import:

```ts
import type {
  Account,
  Category,
  CreditCard,
  FinancialGroup,
  HomeSummary,
  Invoice,
  PendingAlerts,
} from "./types";
```

- [ ] **Step 2: Add the seed month constant**

After `export const currentMonth = "Junho";` add:

```ts
/** Month/year the seeded base summary applies to (June 2026). */
export const SEED_MONTH = 5;
export const SEED_YEAR = 2026;
```

- [ ] **Step 3: Add accounts**

Append:

```ts
export const accounts: Account[] = [
  // PF — included accounts sum to 1164.00 (current Home "saldo atual").
  { id: "pf-cc", name: "Conta Corrente", groupId: "pf", initialBalance: 900, includeInTotal: true },
  { id: "pf-wallet", name: "Carteira", groupId: "pf", initialBalance: 264, includeInTotal: true },
  { id: "pf-poup", name: "Poupança", groupId: "pf", initialBalance: 5000, includeInTotal: false },
  { id: "pj-cc", name: "Conta PJ", groupId: "pj", initialBalance: 3000, includeInTotal: true },
  { id: "usd-wallet", name: "USD Wallet", groupId: "usd", initialBalance: 1200, includeInTotal: true },
  { id: "btc-cold", name: "BTC Cold", groupId: "btc", initialBalance: 0.5, includeInTotal: true },
];
```

- [ ] **Step 4: Add categories (incl. reserved Ajuste)**

```ts
export const ADJUST_EXPENSE_CATEGORY = "cat-ajuste-exp";
export const ADJUST_INCOME_CATEGORY = "cat-ajuste-inc";
export const DEFAULT_EXPENSE_CATEGORY = "cat-despesa-comum";

export const categories: Category[] = [
  { id: "cat-despesa-comum", name: "Despesa comum", kind: "expense", icon: "tag", color: "rgb(229, 72, 77)" },
  { id: "cat-casa", name: "Casa", kind: "expense", icon: "home", color: "rgb(245, 184, 66)" },
  { id: "cat-alimentacao", name: "Alimentação", kind: "expense", icon: "food", color: "rgb(108, 35, 224)" },
  { id: "cat-transporte", name: "Transporte", kind: "expense", icon: "car", color: "rgb(54, 211, 93)" },
  { id: "cat-receita-comum", name: "Receita comum", kind: "income", icon: "tag", color: "rgb(43, 174, 163)" },
  { id: "cat-salario", name: "Salário", kind: "income", icon: "cash", color: "rgb(43, 174, 163)" },
  { id: ADJUST_EXPENSE_CATEGORY, name: "Ajuste", kind: "expense", icon: "adjust", color: "rgb(125, 125, 134)" },
  { id: ADJUST_INCOME_CATEGORY, name: "Ajuste", kind: "income", icon: "adjust", color: "rgb(125, 125, 134)" },
];
```

- [ ] **Step 5: Add invoices + base invoice amounts**

The base amounts mirror the existing `cards` mock so the current open-invoice values are preserved before any user input.

```ts
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
```

- [ ] **Step 6: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/data/mock.ts
git commit -m "feat: seed accounts, categories and invoices"
```

---

## Task 4: Store types & initial state

**Files:**
- Create: `src/store/types.ts`

- [ ] **Step 1: Define store types**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors (file is not yet imported anywhere, but must compile).

- [ ] **Step 3: Commit**

```bash
git add src/store/types.ts
git commit -m "feat: add store state and action types"
```

---

## Task 5: Pure expansion helpers (installments + recurrence)

**Files:**
- Create: `src/store/expand.ts`
- Test: `src/store/__tests__/expand.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import type { Invoice } from "@/data/types";
import { expandInstallments, expandRecurrence } from "@/store/expand";

const invoices: Invoice[] = [
  { id: "inv-nu-jun", cardId: "nu", month: 5, year: 2026, status: "open" },
  { id: "inv-nu-jul", cardId: "nu", month: 6, year: 2026, status: "open" },
  { id: "inv-nu-ago", cardId: "nu", month: 7, year: 2026, status: "open" },
];

function baseCardTx() {
  return {
    id: "t1",
    type: "despesa-cartao" as const,
    amount: 100,
    groupId: "pf",
    date: "2026-06-15",
    cardId: "nu",
    invoiceId: "inv-nu-jun",
    settled: true,
    ignored: false,
    recurrence: "none" as const,
    installments: 3,
    createdAt: "2026-06-15T00:00:00.000Z",
  };
}

describe("expandInstallments", () => {
  it("splits across consecutive invoices, remainder cents on first", () => {
    const tx = { ...baseCardTx(), amount: 100, installments: 3 };
    const rows = expandInstallments(tx, invoices);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.amount)).toEqual([33.34, 33.33, 33.33]);
    expect(rows.map((r) => r.invoiceId)).toEqual([
      "inv-nu-jun",
      "inv-nu-jul",
      "inv-nu-ago",
    ]);
    expect(new Set(rows.map((r) => r.seriesId)).size).toBe(1);
  });

  it("returns a single row when installments <= 1", () => {
    const tx = { ...baseCardTx(), installments: 1 };
    expect(expandInstallments(tx, invoices)).toHaveLength(1);
  });
});

describe("expandRecurrence", () => {
  it("generates 12 monthly occurrences for a recurring account expense", () => {
    const tx = {
      id: "t2",
      type: "despesa" as const,
      amount: 50,
      groupId: "pf",
      date: "2026-06-15",
      accountId: "pf-cc",
      settled: true,
      ignored: false,
      recurrence: "monthly" as const,
      createdAt: "2026-06-15T00:00:00.000Z",
    };
    const rows = expandRecurrence(tx);
    expect(rows).toHaveLength(12);
    expect(rows[0].date).toBe("2026-06-15");
    expect(rows[1].date).toBe("2026-07-15");
    expect(rows[11].date).toBe("2027-05-15");
    expect(new Set(rows.map((r) => r.seriesId)).size).toBe(1);
  });

  it("returns a single row when recurrence is none", () => {
    const tx = {
      id: "t3",
      type: "despesa" as const,
      amount: 50,
      groupId: "pf",
      date: "2026-06-15",
      accountId: "pf-cc",
      settled: true,
      ignored: false,
      recurrence: "none" as const,
      createdAt: "2026-06-15T00:00:00.000Z",
    };
    expect(expandRecurrence(tx)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- expand`
Expected: FAIL — cannot find module `@/store/expand`.

- [ ] **Step 3: Implement `src/store/expand.ts`**

```ts
import type { Invoice, Transaction } from "@/data/types";

const RECURRENCE_HORIZON = 12;

/** Returns YYYY-MM-DD with `months` added, keeping the day-of-month. */
function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const base = new Date(y, m - 1 + months, d);
  const yy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Rounds to 2 decimals avoiding binary float drift. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Splits a card expense across consecutive invoices starting at the selected
 * one. Even split; remainder cents land on the first installment.
 */
export function expandInstallments(
  tx: Transaction,
  invoices: Invoice[],
): Transaction[] {
  const count = tx.installments ?? 1;
  if (count <= 1) return [{ ...tx }];

  const ordered = invoices
    .filter((inv) => inv.cardId === tx.cardId)
    .sort((a, b) => a.year - b.year || a.month - b.month);
  const startIdx = ordered.findIndex((inv) => inv.id === tx.invoiceId);
  const slice = startIdx >= 0 ? ordered.slice(startIdx, startIdx + count) : [];

  const totalCents = Math.round(tx.amount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count;
  const seriesId = tx.id;

  return Array.from({ length: count }, (_, i) => {
    const cents = baseCents + (i === 0 ? remainder : 0);
    const invoice = slice[i] ?? ordered[ordered.length - 1];
    return {
      ...tx,
      id: `${tx.id}-${i + 1}`,
      amount: round2(cents / 100),
      invoiceId: invoice?.id ?? tx.invoiceId,
      seriesId,
    };
  });
}

/**
 * Generates monthly occurrences for a recurring account expense over a bounded
 * 12-month horizon. "fixed" and "monthly" generate identically this round.
 */
export function expandRecurrence(tx: Transaction): Transaction[] {
  if (tx.recurrence === "none") return [{ ...tx }];
  const seriesId = tx.id;
  return Array.from({ length: RECURRENCE_HORIZON }, (_, i) => ({
    ...tx,
    id: `${tx.id}-${i + 1}`,
    date: addMonths(tx.date, i),
    seriesId,
  }));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- expand`
Expected: PASS, all expand tests green.

- [ ] **Step 5: Commit**

```bash
git add src/store/expand.ts src/store/__tests__/expand.test.ts
git commit -m "feat: pure installment and recurrence expansion"
```

---

## Task 6: Reducer

**Files:**
- Create: `src/store/reducer.ts`
- Test: `src/store/__tests__/reducer.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { ADJUST_INCOME_CATEGORY } from "@/data/mock";
import { appReducer, buildInitialState } from "@/store/reducer";
import type { NewTransactionInput } from "@/store/types";

function baseExpense(): NewTransactionInput {
  return {
    type: "despesa",
    amount: 50,
    groupId: "pf",
    date: "2026-06-10",
    categoryId: "cat-despesa-comum",
    accountId: "pf-cc",
    settled: true,
    ignored: false,
    recurrence: "none",
  };
}

describe("appReducer ADD_TRANSACTION", () => {
  it("appends a single transaction", () => {
    const state = buildInitialState();
    const next = appReducer(state, { kind: "ADD_TRANSACTION", input: baseExpense() });
    expect(next.transactions).toHaveLength(state.transactions.length + 1);
    expect(next.transactions.at(-1)?.amount).toBe(50);
  });

  it("expands recurring account expense into 12 occurrences", () => {
    const state = buildInitialState();
    const next = appReducer(state, {
      kind: "ADD_TRANSACTION",
      input: { ...baseExpense(), recurrence: "monthly" },
    });
    expect(next.transactions).toHaveLength(state.transactions.length + 12);
  });
});

describe("appReducer ADJUST_BALANCE", () => {
  it("create-tx mode appends an adjustment transaction reaching the target", () => {
    const state = buildInitialState();
    // pf-cc initialBalance 900, no tx -> current 900. Target 1000 -> +100 income.
    const next = appReducer(state, {
      kind: "ADJUST_BALANCE",
      input: { accountId: "pf-cc", targetBalance: 1000, mode: "create-tx" },
    });
    const added = next.transactions.at(-1);
    expect(added?.adjustment).toBe(true);
    expect(added?.type).toBe("receita");
    expect(added?.amount).toBe(100);
    expect(added?.categoryId).toBe(ADJUST_INCOME_CATEGORY);
    expect(next.accounts).toEqual(state.accounts); // initial balance untouched
  });

  it("modify-initial mode changes initialBalance and adds no transaction", () => {
    const state = buildInitialState();
    const next = appReducer(state, {
      kind: "ADJUST_BALANCE",
      input: { accountId: "pf-cc", targetBalance: 1000, mode: "modify-initial" },
    });
    expect(next.transactions).toHaveLength(state.transactions.length);
    const acc = next.accounts.find((a) => a.id === "pf-cc");
    expect(acc?.initialBalance).toBe(1000);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- reducer`
Expected: FAIL — cannot find module `@/store/reducer`.

- [ ] **Step 3: Implement `src/store/reducer.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- reducer`
Expected: PASS. (Depends on `accountBalance` from Task 7 — if running tasks strictly in order, implement Task 7 first or together. See note below.)

> **Ordering note:** `reducer.ts` imports `accountBalance` from `selectors.ts`. Implement Task 7 before running this task's tests, or implement both modules then run both test files. The commit for this task may follow Task 7.

- [ ] **Step 5: Commit**

```bash
git add src/store/reducer.ts src/store/__tests__/reducer.test.ts
git commit -m "feat: app reducer with add-transaction and adjust-balance"
```

---

## Task 7: Selectors

**Files:**
- Create: `src/store/selectors.ts`
- Test: `src/store/__tests__/selectors.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { buildInitialState } from "@/store/reducer";
import {
  accountBalance,
  groupTransactions,
  homeBalance,
  invoiceAmount,
  invoiceLabel,
  monthExpense,
  monthIncome,
} from "@/store/selectors";
import type { Transaction } from "@/data/types";

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: "x",
    type: "despesa",
    amount: 0,
    groupId: "pf",
    date: "2026-06-10",
    settled: true,
    ignored: false,
    recurrence: "none",
    createdAt: "2026-06-10T00:00:00.000Z",
    ...partial,
  };
}

describe("accountBalance", () => {
  it("is initialBalance plus settled account deltas", () => {
    const state = buildInitialState();
    state.transactions = [
      tx({ id: "a", type: "despesa", amount: 100, accountId: "pf-cc" }),
      tx({ id: "b", type: "receita", amount: 30, accountId: "pf-cc" }),
      tx({ id: "c", type: "despesa", amount: 999, accountId: "pf-cc", settled: false }),
      tx({ id: "d", type: "despesa", amount: 999, accountId: "pf-cc", ignored: true }),
    ];
    expect(accountBalance(state, "pf-cc")).toBe(830); // 900 - 100 + 30
  });

  it("applies transfers to both sides", () => {
    const state = buildInitialState();
    state.transactions = [
      tx({ id: "t", type: "transferencia", amount: 50, fromAccountId: "pf-cc", toAccountId: "pf-wallet" }),
    ];
    expect(accountBalance(state, "pf-cc")).toBe(850); // 900 - 50
    expect(accountBalance(state, "pf-wallet")).toBe(314); // 264 + 50
  });
});

describe("homeBalance", () => {
  it("sums only includeInTotal accounts of the group", () => {
    const state = buildInitialState();
    expect(homeBalance(state, "pf")).toBe(1164); // 900 + 264, Poupança excluded
  });
});

describe("monthIncome / monthExpense", () => {
  it("is base plus deltas for the matching group and month", () => {
    const state = buildInitialState();
    state.transactions = [
      tx({ id: "e1", type: "despesa", amount: 100, date: "2026-06-05" }),
      tx({ id: "i1", type: "receita", amount: 200, date: "2026-06-05" }),
      tx({ id: "x1", type: "despesa", amount: 999, date: "2026-07-05" }), // other month
      tx({ id: "adj", type: "despesa", amount: 999, date: "2026-06-05", adjustment: true }), // excluded
    ];
    expect(monthExpense(state, "pf", 5, 2026)).toBe(31668.29); // 31568.29 + 100
    expect(monthIncome(state, "pf", 5, 2026)).toBe(17237.36); // 17037.36 + 200
  });
});

describe("invoiceAmount", () => {
  it("is base plus card-expense deltas for the invoice", () => {
    const state = buildInitialState();
    state.transactions = [
      tx({ id: "c1", type: "despesa-cartao", amount: 29, cardId: "nu", invoiceId: "inv-nu-jun" }),
    ];
    expect(invoiceAmount(state, "inv-nu-jun")).toBe(774.01); // 745.01 + 29
  });
});

describe("invoiceLabel", () => {
  it("formats month and year in pt-BR", () => {
    expect(invoiceLabel(6, 2026)).toBe("Fatura de julho de 2026");
  });
});

describe("groupTransactions", () => {
  it("filters by type and group, sorted by date desc", () => {
    const state = buildInitialState();
    state.transactions = [
      tx({ id: "1", type: "despesa", date: "2026-06-01" }),
      tx({ id: "2", type: "receita", date: "2026-06-02" }),
      tx({ id: "3", type: "despesa-cartao", date: "2026-06-03", cardId: "nu", invoiceId: "inv-nu-jun" }),
      tx({ id: "4", type: "transferencia", date: "2026-06-04", fromAccountId: "pf-cc", toAccountId: "pf-wallet" }),
    ];
    expect(groupTransactions(state, "pf", 5, 2026, "despesa").map((t) => t.id)).toEqual(["3", "1"]);
    expect(groupTransactions(state, "pf", 5, 2026, "all").map((t) => t.id)).toEqual(["4", "3", "2", "1"]);
    expect(groupTransactions(state, "pf", 5, 2026, "transferencia").map((t) => t.id)).toEqual(["4"]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- selectors`
Expected: FAIL — cannot find module `@/store/selectors`.

- [ ] **Step 3: Implement `src/store/selectors.ts`**

```ts
import type { Account, Transaction, TransactionFilter } from "@/data/types";
import type { AppState } from "@/store/types";

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
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

export function monthExpense(state: AppState, groupId: string, month: number, year: number): number {
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
```

- [ ] **Step 4: Run to verify pass (both selector and reducer suites)**

Run: `npm test`
Expected: PASS — expand, reducer, and selectors suites all green.

- [ ] **Step 5: Commit**

```bash
git add src/store/selectors.ts src/store/__tests__/selectors.test.ts
git commit -m "feat: store selectors for balances, summary and transactions"
```

---

## Task 8: Store provider & hooks

**Files:**
- Create: `src/store/AppStateProvider.tsx`

- [ ] **Step 1: Implement the provider**

```tsx
import { createContext, type ReactNode, useContext, useReducer } from "react";
import { appReducer, buildInitialState } from "@/store/reducer";
import type { Action, AppState } from "@/store/types";

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, buildInitialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function useAppDispatch(): React.Dispatch<Action> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useAppDispatch must be used within AppStateProvider");
  return ctx;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/AppStateProvider.tsx
git commit -m "feat: app state provider and hooks"
```

---

## Task 9: Toast host

**Files:**
- Create: `src/components/Toast.tsx`, `src/components/Toast.css`

- [ ] **Step 1: Implement `Toast.tsx`**

```tsx
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import "./Toast.css";

interface ToastApi {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2500);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
```

> Note: remove the stray `useCallback` import above if your linter flags it — the simple `show` does not need memoization. The import line should be `import { createContext, type ReactNode, useContext, useState } from "react";`.

- [ ] **Step 2: Implement `Toast.css`**

```css
.toast {
  position: fixed;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 12px 20px;
  border-radius: 999px;
  background: var(--color-surface-2, #2a2a30);
  color: var(--color-text, #fff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  font-size: 14px;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Toast.tsx src/components/Toast.css
git commit -m "feat: toast host"
```

---

## Task 10: Presentation wrapper (mobile full-screen / desktop modal)

**Files:**
- Create: `src/components/Presentation.tsx`, `src/components/Presentation.css`

- [ ] **Step 1: Implement `Presentation.tsx`**

```tsx
import type { ReactNode } from "react";
import "./Presentation.css";

interface Props {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}

/** Full-screen overlay on mobile, centered modal on desktop. */
export function Presentation({ open, onClose, ariaLabel, children }: Props) {
  if (!open) return null;
  return (
    <div className="presentation" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <button className="presentation__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="presentation__panel">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `Presentation.css`**

Match the existing breakpoint used by `.mobile-only` / `.desktop-only` (inspect `src/App.css`). The panel is full-bleed on mobile and a centered card on desktop.

```css
.presentation {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
}

.presentation__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.5);
}

.presentation__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--color-bg, #0f0f12);
  overflow-y: auto;
}

@media (min-width: 768px) {
  .presentation {
    align-items: center;
    justify-content: center;
  }
  .presentation__panel {
    width: 480px;
    max-width: calc(100vw - 48px);
    height: auto;
    max-height: calc(100vh - 64px);
    border-radius: 20px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  }
}
```

- [ ] **Step 3: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/components/Presentation.tsx src/components/Presentation.css
git commit -m "feat: presentation wrapper (mobile fullscreen / desktop modal)"
```

---

## Task 11: Shared PickerSheet

**Files:**
- Create: `src/components/PickerSheet.tsx`, `src/components/PickerSheet.css`

- [ ] **Step 1: Implement `PickerSheet.tsx`**

A generic single-select list rendered inside the existing `BottomSheet` on mobile and a small modal on desktop. To keep one code path, reuse `BottomSheet` for both viewports this round (acceptable for short option lists).

```tsx
import { BottomSheet } from "./BottomSheet";

export interface PickerOption {
  id: string;
  label: string;
  hint?: string;
}

interface Props {
  open: boolean;
  title: string;
  options: PickerOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function PickerSheet({ open, title, options, selectedId, onSelect, onClose }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <ul className="picker" role="listbox">
        {options.map((opt) => (
          <li key={opt.id} role="none">
            <button
              type="button"
              role="option"
              aria-selected={opt.id === selectedId}
              className={`picker__item${opt.id === selectedId ? " picker__item--active" : ""}`}
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
            >
              <span className="picker__label">{opt.label}</span>
              {opt.hint && <span className="picker__hint">{opt.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
```

- [ ] **Step 2: Implement `PickerSheet.css`**

```css
.picker {
  list-style: none;
  margin: 0;
  padding: 4px 0 8px;
}
.picker__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 20px;
  border: 0;
  background: transparent;
  color: var(--color-text, #fff);
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}
.picker__item--active {
  color: var(--color-accent, rgb(108, 35, 224));
  font-weight: 600;
}
.picker__hint {
  color: var(--color-text-muted, #9a9aa3);
  font-size: 13px;
}
```

- [ ] **Step 3: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/components/PickerSheet.tsx src/components/PickerSheet.css
git commit -m "feat: shared picker sheet"
```

---

## Task 12: AmountInput

**Files:**
- Create: `src/components/form/AmountInput.tsx`, `src/components/form/AmountInput.css`

- [ ] **Step 1: Implement `AmountInput.tsx`**

Stores the value as a number (units, e.g. `12.34`). Displays formatted via `formatMoney`. Typing edits cents (numeric keypad behavior): each digit shifts cents.

```tsx
import type { Currency } from "@/data/types";
import { formatMoney } from "@/lib/format";
import "./AmountInput.css";

interface Props {
  value: number;
  currency: Currency;
  error?: string;
  onChange: (value: number) => void;
}

export function AmountInput({ value, currency, error, onChange }: Props) {
  const handleKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const cents = digits === "" ? 0 : Number.parseInt(digits, 10);
    onChange(cents / 100);
  };

  return (
    <div className={`amount${error ? " amount--error" : ""}`}>
      <input
        className="amount__field"
        inputMode="numeric"
        aria-label="Valor"
        value={formatMoney(value, currency)}
        onChange={handleKey}
      />
      {error && <span className="amount__error">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 2: Implement `AmountInput.css`**

```css
.amount {
  padding: 16px 20px;
}
.amount__field {
  width: 100%;
  border: 0;
  border-bottom: 2px solid var(--color-accent, rgb(108, 35, 224));
  background: transparent;
  color: var(--color-text, #fff);
  font-size: 32px;
  font-weight: 600;
  padding: 8px 0;
}
.amount--error .amount__field {
  border-bottom-color: var(--color-expense, rgb(229, 72, 77));
}
.amount__error {
  display: block;
  margin-top: 6px;
  color: var(--color-expense, rgb(229, 72, 77));
  font-size: 13px;
}
```

- [ ] **Step 3: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/components/form/AmountInput.tsx src/components/form/AmountInput.css
git commit -m "feat: amount input"
```

---

## Task 13: TypeSwitcher

**Files:**
- Create: `src/components/form/TypeSwitcher.tsx`, `src/components/form/TypeSwitcher.css`

- [ ] **Step 1: Implement `TypeSwitcher.tsx`**

Switches between `despesa`, `receita`, `despesa-cartao`. `transferencia` is fixed (entered from the Novo menu) and renders a static pill without a dropdown.

```tsx
import { useState } from "react";
import type { TransactionType } from "@/data/types";
import { PickerSheet } from "@/components/PickerSheet";
import "./TypeSwitcher.css";

const LABELS: Record<TransactionType, string> = {
  despesa: "Despesa",
  receita: "Receita",
  "despesa-cartao": "Desp. Cartão",
  transferencia: "Transferência",
};

const SWITCHABLE: TransactionType[] = ["despesa", "receita", "despesa-cartao"];

interface Props {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export function TypeSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const fixed = value === "transferencia";

  return (
    <>
      <button
        type="button"
        className={`type-pill type-pill--${value}`}
        disabled={fixed}
        onClick={() => setOpen(true)}
      >
        {LABELS[value]}
        {!fixed && " ▾"}
      </button>
      <PickerSheet
        open={open}
        title="Tipo de lançamento"
        selectedId={value}
        options={SWITCHABLE.map((t) => ({ id: t, label: LABELS[t] }))}
        onSelect={(id) => onChange(id as TransactionType)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

- [ ] **Step 2: Implement `TypeSwitcher.css`**

```css
.type-pill {
  padding: 8px 18px;
  border: 0;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: var(--color-surface-2, #2a2a30);
  cursor: pointer;
}
.type-pill--despesa { background: var(--color-expense, rgb(229, 72, 77)); }
.type-pill--receita { background: var(--color-income, rgb(43, 174, 163)); }
.type-pill--despesa-cartao { background: var(--color-accent, rgb(108, 35, 224)); }
.type-pill--transferencia { background: rgb(54, 130, 211); }
.type-pill:disabled { cursor: default; }
```

- [ ] **Step 3: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/components/form/TypeSwitcher.tsx src/components/form/TypeSwitcher.css
git commit -m "feat: transaction type switcher"
```

---

## Task 14: TransactionForm

**Files:**
- Create: `src/screens/transaction/TransactionForm.tsx`, `src/screens/transaction/TransactionForm.css`

This screen assembles the store, pickers, amount input, switcher, and dispatch. It is the largest component; build it whole, then verify in the browser.

- [ ] **Step 1: Implement `TransactionForm.tsx`**

```tsx
import { useMemo, useState } from "react";
import { PickerSheet } from "@/components/PickerSheet";
import { Presentation } from "@/components/Presentation";
import { AmountInput } from "@/components/form/AmountInput";
import { TypeSwitcher } from "@/components/form/TypeSwitcher";
import { useToast } from "@/components/Toast";
import { DEFAULT_EXPENSE_CATEGORY } from "@/data/mock";
import { resolveGroup } from "@/data/mock";
import type { Recurrence, TransactionType } from "@/data/types";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import { cardInvoices, groupAccounts, invoiceLabel } from "@/store/selectors";
import type { NewTransactionInput } from "@/store/types";
import "./TransactionForm.css";

interface Props {
  open: boolean;
  initialType: TransactionType;
  initialGroupId: string;
  onClose: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ open, initialType, initialGroupId, onClose }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [type, setType] = useState<TransactionType>(initialType);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(DEFAULT_EXPENSE_CATEGORY);
  const [accountId, setAccountId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [cardId, setCardId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [settled, setSettled] = useState(true);
  const [ignored, setIgnored] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [installments, setInstallments] = useState(1);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string>();

  // active sub-picker: "group" | "category" | "account" | "from" | "to" | "card" | "invoice"
  const [picker, setPicker] = useState<string | null>(null);

  const currency = resolveGroup(groupId).currency;
  const accounts = useMemo(() => groupAccounts(state, groupId), [state, groupId]);
  const cards = state.cards;
  const invoices = useMemo(() => (cardId ? cardInvoices(state, cardId) : []), [state, cardId]);
  const categories = state.categories.filter((c) =>
    type === "receita" ? c.kind === "income" : c.kind === "expense",
  );

  const reset = () => {
    setAmount(0);
    setDescription("");
    setError(undefined);
  };

  const buildInput = (): NewTransactionInput | null => {
    if (amount === 0) {
      setError("Deve ter um valor diferente de 0");
      return null;
    }
    if (type === "transferencia" && fromAccountId === toAccountId) {
      setError("Origem e destino devem ser diferentes");
      return null;
    }
    const common = { amount, groupId, date, description: description || undefined, ignored };
    if (type === "transferencia") {
      return { type, ...common, fromAccountId, toAccountId, settled: true, recurrence: "none" };
    }
    if (type === "despesa-cartao") {
      return { type, ...common, categoryId, cardId, invoiceId, settled: true, recurrence: "none", installments };
    }
    return { type, ...common, categoryId, accountId, settled, recurrence };
  };

  const save = (again: boolean) => {
    const input = buildInput();
    if (!input) return;
    dispatch({ kind: "ADD_TRANSACTION", input });
    toast.show("Lançamento salvo");
    if (again) reset();
    else onClose();
  };

  return (
    <Presentation open={open} onClose={onClose} ariaLabel="Novo lançamento">
      <header className="txform__header">
        <button type="button" className="txform__cancel" onClick={onClose}>
          Cancelar
        </button>
        <TypeSwitcher value={type} onChange={setType} />
        <span className="txform__spacer" />
      </header>

      <AmountInput value={amount} currency={currency} error={error} onChange={setAmount} />

      <div className="txform__fields">
        <FieldRow label="Grupo" value={resolveGroup(groupId).name} onClick={() => setPicker("group")} />

        <div className="txform__chips">
          {(
            [
              ["Hoje", todayISO()],
              ["Ontem", new Date(Date.now() - 86400000).toISOString().slice(0, 10)],
            ] as const
          ).map(([label, iso]) => (
            <button
              key={label}
              type="button"
              className={`txform__chip${date === iso ? " txform__chip--active" : ""}`}
              onClick={() => setDate(iso)}
            >
              {label}
            </button>
          ))}
          <input
            type="date"
            className="txform__date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <label className="txform__text">
          <span>Descrição</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        {type !== "transferencia" && (
          <FieldRow
            label="Categoria"
            value={state.categories.find((c) => c.id === categoryId)?.name ?? "Selecionar"}
            onClick={() => setPicker("category")}
          />
        )}

        {(type === "despesa" || type === "receita") && (
          <FieldRow
            label="Conta"
            value={accounts.find((a) => a.id === accountId)?.name ?? "Selecionar"}
            onClick={() => setPicker("account")}
          />
        )}

        {type === "despesa-cartao" && (
          <>
            <FieldRow
              label="Cartão"
              value={cards.find((c) => c.id === cardId)?.name ?? "Selecionar"}
              onClick={() => setPicker("card")}
            />
            <FieldRow
              label="Fatura"
              value={
                invoices.find((i) => i.id === invoiceId)
                  ? invoiceLabel(
                      invoices.find((i) => i.id === invoiceId)!.month,
                      invoices.find((i) => i.id === invoiceId)!.year,
                    )
                  : "Selecionar"
              }
              onClick={() => setPicker("invoice")}
            />
          </>
        )}

        {type === "transferencia" && (
          <>
            <FieldRow
              label="De"
              value={accounts.find((a) => a.id === fromAccountId)?.name ?? "Selecionar"}
              onClick={() => setPicker("from")}
            />
            <FieldRow
              label="Para"
              value={accounts.find((a) => a.id === toAccountId)?.name ?? "Selecionar"}
              onClick={() => setPicker("to")}
            />
          </>
        )}

        {(type === "despesa" || type === "receita") && (
          <label className="txform__toggle">
            <span>{type === "receita" ? "Recebido" : "Pago"}</span>
            <input type="checkbox" checked={settled} onChange={(e) => setSettled(e.target.checked)} />
          </label>
        )}

        <label className="txform__toggle">
          <span>Ignorar transação</span>
          <input type="checkbox" checked={ignored} onChange={(e) => setIgnored(e.target.checked)} />
        </label>

        <button type="button" className="txform__more" onClick={() => setShowMore((s) => !s)}>
          Mais detalhes {showMore ? "▴" : "▾"}
        </button>

        {showMore && type === "despesa" && (
          <label className="txform__text">
            <span>Recorrência</span>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
              <option value="none">Não repete</option>
              <option value="fixed">Fixa</option>
              <option value="monthly">Mensal</option>
            </select>
          </label>
        )}

        {showMore && type === "despesa-cartao" && (
          <label className="txform__text">
            <span>Parcelas</span>
            <input
              type="number"
              min={1}
              value={installments}
              onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
            />
          </label>
        )}
      </div>

      <footer className="txform__footer">
        <button type="button" className="txform__save-again" onClick={() => save(true)}>
          Salvar e criar nova
        </button>
        <button type="button" className="txform__save" onClick={() => save(false)}>
          Salvar
        </button>
      </footer>

      <PickerSheet
        open={picker === "group"}
        title="Grupo"
        selectedId={groupId}
        options={state.groups.map((g) => ({ id: g.id, label: g.name }))}
        onSelect={(id) => {
          setGroupId(id);
          setAccountId("");
          setCardId("");
          setInvoiceId("");
        }}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "category"}
        title="Categoria"
        selectedId={categoryId}
        options={categories.map((c) => ({ id: c.id, label: c.name }))}
        onSelect={setCategoryId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "account"}
        title="Conta"
        selectedId={accountId}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        onSelect={setAccountId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "from"}
        title="De"
        selectedId={fromAccountId}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        onSelect={setFromAccountId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "to"}
        title="Para"
        selectedId={toAccountId}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        onSelect={setToAccountId}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "card"}
        title="Cartão"
        selectedId={cardId}
        options={cards.map((c) => ({ id: c.id, label: c.name }))}
        onSelect={(id) => {
          setCardId(id);
          setInvoiceId("");
        }}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === "invoice"}
        title="Fatura"
        selectedId={invoiceId}
        options={invoices.map((i) => ({ id: i.id, label: invoiceLabel(i.month, i.year) }))}
        onSelect={setInvoiceId}
        onClose={() => setPicker(null)}
      />
    </Presentation>
  );
}

function FieldRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" className="txform__row" onClick={onClick}>
      <span className="txform__row-label">{label}</span>
      <span className="txform__row-value">{value}</span>
    </button>
  );
}
```

- [ ] **Step 2: Implement `TransactionForm.css`**

```css
.txform__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}
.txform__cancel,
.txform__spacer {
  flex: 1;
  min-width: 64px;
}
.txform__cancel {
  border: 0;
  background: transparent;
  color: var(--color-accent, rgb(108, 35, 224));
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}
.txform__fields {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
}
.txform__row {
  display: flex;
  justify-content: space-between;
  padding: 16px 12px;
  border: 0;
  border-bottom: 1px solid var(--color-divider, #2a2a30);
  background: transparent;
  color: var(--color-text, #fff);
  font-size: 15px;
  cursor: pointer;
}
.txform__row-label {
  color: var(--color-text-muted, #9a9aa3);
}
.txform__chips {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  flex-wrap: wrap;
}
.txform__chip {
  padding: 6px 14px;
  border: 1px solid var(--color-divider, #2a2a30);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text, #fff);
  cursor: pointer;
}
.txform__chip--active {
  border-color: var(--color-accent, rgb(108, 35, 224));
  color: var(--color-accent, rgb(108, 35, 224));
}
.txform__date {
  background: transparent;
  color: var(--color-text, #fff);
  border: 1px solid var(--color-divider, #2a2a30);
  border-radius: 8px;
  padding: 6px 10px;
}
.txform__text,
.txform__toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-bottom: 1px solid var(--color-divider, #2a2a30);
  color: var(--color-text, #fff);
}
.txform__text input,
.txform__text select {
  flex: 1;
  max-width: 60%;
  background: transparent;
  border: 0;
  color: var(--color-text, #fff);
  text-align: right;
  font-size: 15px;
}
.txform__more {
  margin: 12px;
  border: 0;
  background: transparent;
  color: var(--color-accent, rgb(108, 35, 224));
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}
.txform__footer {
  margin-top: auto;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
}
.txform__save-again,
.txform__save {
  flex: 1;
  padding: 14px;
  border: 0;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.txform__save-again {
  background: var(--color-surface-2, #2a2a30);
  color: var(--color-text, #fff);
}
.txform__save {
  background: var(--color-accent, rgb(108, 35, 224));
  color: #fff;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/transaction/TransactionForm.tsx src/screens/transaction/TransactionForm.css
git commit -m "feat: transaction form for all four types"
```

---

## Task 15: Wire providers + form into App

**Files:**
- Modify: `src/main.tsx` (or `src/App.tsx` root) and `src/App.tsx`

- [ ] **Step 1: Wrap the app in providers**

In `src/main.tsx`, wrap `<App />` with the store and toast providers. Show the relevant edit:

```tsx
import { AppStateProvider } from "@/store/AppStateProvider";
import { ToastProvider } from "@/components/Toast";

// inside render:
//   <AppStateProvider>
//     <ToastProvider>
//       <App />
//     </ToastProvider>
//   </AppStateProvider>
```

- [ ] **Step 2: Open the form from `handleNewAction`**

In `src/App.tsx`, add state and replace the TODO:

```tsx
import { TransactionForm } from "@/screens/transaction/TransactionForm";
import type { TransactionType } from "@/data/types";

// map NewAction id -> TransactionType
const NEW_ACTION_TYPE: Record<NewAction, TransactionType> = {
  despesa: "despesa",
  receita: "receita",
  "despesa-cartao": "despesa-cartao",
  transferencia: "transferencia",
};

// inside App():
const [formOpen, setFormOpen] = useState(false);
const [formType, setFormType] = useState<TransactionType>("despesa");

const handleNewAction = (action: NewAction) => {
  setFormType(NEW_ACTION_TYPE[action]);
  setFormOpen(true);
};
```

Render the form near the other sheets (outside the `mobile-only` wrapper so it shows on both viewports):

```tsx
<TransactionForm
  open={formOpen}
  initialType={formType}
  initialGroupId={groupId}
  onClose={() => setFormOpen(false)}
/>
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`
Manual check:
- Click the bottom-nav `+` → choose `Despesa` → form opens (full-screen on a narrow window, modal on a wide window).
- Enter a value, pick a Conta, Salvar → toast `Lançamento salvo`, form closes.
- Reopen with value 0 and Salvar → inline error `Deve ter um valor diferente de 0`.

- [ ] **Step 4: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: wire store, toast and transaction form into app"
```

---

## Task 16: Home & Dashboard read derived balance

**Files:**
- Modify: `src/screens/home/Hero.tsx`, `src/screens/dashboard/SummaryCards.tsx`

The Home hero balance and the dashboard "saldo" card must reflect `homeBalance` so adjustments and new transactions update them. Inspect each file first; replace the static `summary.balance` source with the selector.

- [ ] **Step 1: Update `Hero.tsx`**

Read the file, then replace its balance source. Example shape (adapt to actual props):

```tsx
import { useAppState } from "@/store/AppStateProvider";
import { homeBalance, monthExpense, monthIncome } from "@/store/selectors";

// inside the component, given groupId/month/year already available:
const state = useAppState();
const balance = homeBalance(state, groupId);
// use `balance` where `summary.balance` was used
```

> If `Hero` does not currently receive `groupId`, pass it down from `HomeScreen` (which already has it per `App.tsx`).

- [ ] **Step 2: Update `SummaryCards.tsx`**

Read the file, then source the saldo/receitas/despesas cards from selectors:

```tsx
import { useAppState } from "@/store/AppStateProvider";
import { homeBalance, monthExpense, monthIncome } from "@/store/selectors";

const state = useAppState();
const balance = homeBalance(state, groupId);
const income = monthIncome(state, groupId, month, year);
const expense = monthExpense(state, groupId, month, year);
```

> `SummaryCards` must receive `groupId`, `month`, `year`. `DashboardDesktop` already holds these (see `App.tsx`); thread them through if not already passed.

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`
Manual check: the PF Home balance still reads `R$ 1.164,00` at start (derived from seeded accounts). Add a `Despesa` of `R$ 100,00` on a PF account marked `includeInTotal` → balance drops to `R$ 1.064,00`.

- [ ] **Step 4: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/screens/home/Hero.tsx src/screens/dashboard/SummaryCards.tsx
git commit -m "feat: home and dashboard read derived balances"
```

---

## Task 17: Accounts screen + AccountSheet

**Files:**
- Create: `src/screens/accounts/AccountsScreen.tsx`, `.css`, `src/screens/accounts/AccountSheet.tsx`

- [ ] **Step 1: Implement `AccountsScreen.tsx`**

```tsx
import { useMemo, useState } from "react";
import { resolveGroup } from "@/data/mock";
import { formatMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { accountBalance } from "@/store/selectors";
import { AccountSheet } from "./AccountSheet";
import "./AccountsScreen.css";

export function AccountsScreen() {
  const state = useAppState();
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  const byGroup = useMemo(() => {
    return state.groups.map((g) => ({
      group: g,
      accounts: state.accounts.filter((a) => a.groupId === g.id),
    }));
  }, [state.groups, state.accounts]);

  return (
    <div className="accounts">
      <h1 className="accounts__title">Contas</h1>
      {byGroup.map(({ group, accounts }) =>
        accounts.length === 0 ? null : (
          <section key={group.id} className="accounts__group">
            <h2 className="accounts__group-name">{group.name}</h2>
            <ul className="accounts__list">
              {accounts.map((a) => (
                <li key={a.id}>
                  <button type="button" className="accounts__row" onClick={() => setActiveAccount(a.id)}>
                    <span>{a.name}</span>
                    <span>{formatMoney(accountBalance(state, a.id), resolveGroup(a.groupId).currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
      <AccountSheet
        accountId={activeAccount}
        onClose={() => setActiveAccount(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Implement `AccountsScreen.css`**

```css
.accounts {
  padding: 20px;
}
.accounts__title {
  font-size: 24px;
  margin: 0 0 16px;
}
.accounts__group-name {
  font-size: 13px;
  text-transform: uppercase;
  color: var(--color-text-muted, #9a9aa3);
  margin: 20px 0 8px;
}
.accounts__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.accounts__row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 16px 4px;
  border: 0;
  border-bottom: 1px solid var(--color-divider, #2a2a30);
  background: transparent;
  color: var(--color-text, #fff);
  font-size: 15px;
  cursor: pointer;
}
```

- [ ] **Step 3: Implement `AccountSheet.tsx`**

```tsx
import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { useAppState } from "@/store/AppStateProvider";
import { BalanceAdjustSheet } from "./BalanceAdjustSheet";

interface Props {
  accountId: string | null;
  onClose: () => void;
}

export function AccountSheet({ accountId, onClose }: Props) {
  const state = useAppState();
  const [adjusting, setAdjusting] = useState(false);
  const account = state.accounts.find((a) => a.id === accountId);

  return (
    <>
      <BottomSheet open={!!accountId && !adjusting} onClose={onClose} title={account?.name}>
        <ul className="picker">
          <li>
            <button type="button" className="picker__item" onClick={() => setAdjusting(true)}>
              <span className="picker__label">Reajustar saldo</span>
            </button>
          </li>
        </ul>
      </BottomSheet>
      <BalanceAdjustSheet
        accountId={adjusting ? accountId : null}
        onClose={() => {
          setAdjusting(false);
          onClose();
        }}
      />
    </>
  );
}
```

- [ ] **Step 4: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/screens/accounts/AccountsScreen.tsx src/screens/accounts/AccountsScreen.css src/screens/accounts/AccountSheet.tsx
git commit -m "feat: accounts screen and account sheet"
```

---

## Task 18: BalanceAdjustSheet (Reajuste de saldo)

**Files:**
- Create: `src/screens/accounts/BalanceAdjustSheet.tsx`, `.css`

- [ ] **Step 1: Implement `BalanceAdjustSheet.tsx`**

```tsx
import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { AmountInput } from "@/components/form/AmountInput";
import { useToast } from "@/components/Toast";
import { resolveGroup } from "@/data/mock";
import { formatMoney } from "@/lib/format";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import { accountBalance } from "@/store/selectors";
import type { AdjustMode } from "@/store/types";
import "./BalanceAdjustSheet.css";

interface Props {
  accountId: string | null;
  onClose: () => void;
}

export function BalanceAdjustSheet({ accountId, onClose }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const account = state.accounts.find((a) => a.id === accountId);
  const currency = account ? resolveGroup(account.groupId).currency : "BRL";
  const current = account ? accountBalance(state, account.id) : 0;

  const [target, setTarget] = useState(0);
  const [mode, setMode] = useState<AdjustMode>("create-tx");
  const [description, setDescription] = useState("");

  const diff = Math.round((target - current) * 100) / 100;
  const disabled = diff === 0;

  const save = () => {
    if (!account || disabled) return;
    dispatch({
      kind: "ADJUST_BALANCE",
      input: { accountId: account.id, targetBalance: target, mode, description: description || undefined },
    });
    toast.show("Saldo reajustado");
    onClose();
  };

  return (
    <BottomSheet open={!!accountId} onClose={onClose} title="Reajuste de saldo">
      <AmountInput value={target} currency={currency} onChange={setTarget} />
      <div className="adjust__current">
        <span>Saldo atual da conta</span>
        <strong>{formatMoney(current, currency)}</strong>
      </div>
      <p className="adjust__hint">Você gostaria de…</p>
      <div className="adjust__options">
        <button
          type="button"
          className={`adjust__option${mode === "create-tx" ? " adjust__option--active" : ""}`}
          onClick={() => setMode("create-tx")}
        >
          <strong>CRIAR TRANSAÇÃO DE AJUSTE</strong>
          <span>Para ajustar seu saldo uma transação de ajuste será criada.</span>
        </button>
        <button
          type="button"
          className={`adjust__option${mode === "modify-initial" ? " adjust__option--active" : ""}`}
          onClick={() => setMode("modify-initial")}
        >
          <strong>MODIFICAR SALDO INICIAL</strong>
          <span>Altera o saldo inicial. Alguns saldos de fim de mês serão impactados.</span>
        </button>
      </div>
      <label className="adjust__desc">
        <span>Descrição</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="adjust__footer">
        <button type="button" className="adjust__cancel" onClick={onClose}>
          CANCELAR
        </button>
        <button type="button" className="adjust__save" disabled={disabled} onClick={save}>
          SALVAR
        </button>
      </div>
    </BottomSheet>
  );
}
```

> Note: the spec's reference shows "Saldo inicial da conta". We display the **current** balance because the reajuste target is computed against current balance; the label reads "Saldo atual da conta" to stay accurate. (If you prefer to also show the initial balance, add a second row reading `account.initialBalance`.)

- [ ] **Step 2: Implement `BalanceAdjustSheet.css`**

```css
.adjust__current {
  display: flex;
  justify-content: space-between;
  padding: 8px 20px 16px;
  color: var(--color-text-muted, #9a9aa3);
}
.adjust__hint {
  padding: 0 20px;
  color: var(--color-text-muted, #9a9aa3);
}
.adjust__options {
  display: flex;
  gap: 12px;
  padding: 8px 20px;
}
.adjust__option {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--color-divider, #2a2a30);
  border-radius: 12px;
  background: transparent;
  color: var(--color-text, #fff);
  text-align: left;
  cursor: pointer;
}
.adjust__option--active {
  border-color: var(--color-accent, rgb(108, 35, 224));
}
.adjust__option span {
  font-size: 12px;
  color: var(--color-text-muted, #9a9aa3);
}
.adjust__desc {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
}
.adjust__desc input {
  flex: 1;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--color-divider, #2a2a30);
  color: var(--color-text, #fff);
}
.adjust__footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 20px;
}
.adjust__cancel {
  border: 0;
  background: transparent;
  color: var(--color-accent, rgb(108, 35, 224));
  cursor: pointer;
}
.adjust__save {
  padding: 12px 28px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent, rgb(108, 35, 224));
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.adjust__save:disabled {
  opacity: 0.5;
  cursor: default;
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`
Manual check: open Contas → an account → Reajustar saldo. Type a target above current, choose "Criar transação de ajuste", Salvar → account balance becomes the target; toast `Saldo reajustado`.

- [ ] **Step 4: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/screens/accounts/BalanceAdjustSheet.tsx src/screens/accounts/BalanceAdjustSheet.css
git commit -m "feat: balance adjustment sheet"
```

---

## Task 19: Transactions screen + type filter

**Files:**
- Create: `src/screens/transactions/TransactionsScreen.tsx`, `.css`, `src/screens/transactions/TypeFilterMenu.tsx`

- [ ] **Step 1: Implement `TypeFilterMenu.tsx`**

```tsx
import { PickerSheet } from "@/components/PickerSheet";
import type { TransactionFilter } from "@/data/types";

const OPTIONS: { id: TransactionFilter; label: string }[] = [
  { id: "all", label: "Todas as transações" },
  { id: "despesa", label: "Despesas" },
  { id: "receita", label: "Receitas" },
  { id: "transferencia", label: "Transferências" },
];

interface Props {
  open: boolean;
  value: TransactionFilter;
  onSelect: (filter: TransactionFilter) => void;
  onClose: () => void;
}

export function TypeFilterMenu({ open, value, onSelect, onClose }: Props) {
  return (
    <PickerSheet
      open={open}
      title="Transações"
      selectedId={value}
      options={OPTIONS}
      onSelect={(id) => onSelect(id as TransactionFilter)}
      onClose={onClose}
    />
  );
}

export const FILTER_LABELS: Record<TransactionFilter, string> = {
  all: "Todas",
  despesa: "Despesas",
  receita: "Receitas",
  transferencia: "Transferências",
};
```

- [ ] **Step 2: Implement `TransactionsScreen.tsx`**

```tsx
import { useMemo, useState } from "react";
import { resolveGroup } from "@/data/mock";
import type { Transaction, TransactionFilter } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { groupTransactions } from "@/store/selectors";
import { FILTER_LABELS, TypeFilterMenu } from "./TypeFilterMenu";
import "./TransactionsScreen.css";

interface Props {
  groupId: string;
  month: number;
  year: number;
  monthLabel: string;
}

const WEEKDAYS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

function dayHeading(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d}`;
}

function signed(tx: Transaction): number {
  if (tx.type === "receita") return tx.amount;
  if (tx.type === "transferencia") return 0;
  return -tx.amount;
}

export function TransactionsScreen({ groupId, month, year, monthLabel }: Props) {
  const state = useAppState();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const currency = resolveGroup(groupId).currency;
  const rows = useMemo(
    () => groupTransactions(state, groupId, month, year, filter),
    [state, groupId, month, year, filter],
  );

  const totals = useMemo(() => {
    let pending = 0;
    let paid = 0;
    for (const t of rows) {
      if (t.type === "transferencia") continue;
      if (t.settled) paid += t.amount;
      else pending += t.amount;
    }
    return { pending, paid };
  }, [rows]);

  // group by day
  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of rows) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <div className="txlist">
      <header className="txlist__header">
        <button type="button" className="txlist__filter" onClick={() => setMenuOpen(true)}>
          {FILTER_LABELS[filter]} ▾
        </button>
        <div className="txlist__month">{monthLabel}</div>
      </header>

      <div className="txlist__totals">
        <div>
          <span>Total pendente</span>
          <strong>{formatMoney(totals.pending, currency)}</strong>
        </div>
        <div>
          <span>Total pago</span>
          <strong>{formatMoney(totals.paid, currency)}</strong>
        </div>
      </div>

      {byDay.length === 0 && <p className="txlist__empty">Nenhuma transação neste mês.</p>}

      {byDay.map(([day, items]) => (
        <section key={day} className="txlist__day">
          <h3 className="txlist__day-head">{dayHeading(day)}</h3>
          <ul className="txlist__items">
            {items.map((t) => (
              <li key={t.id} className="txlist__item">
                <div className="txlist__item-main">
                  <span className="txlist__item-title">
                    {t.description ||
                      state.categories.find((c) => c.id === t.categoryId)?.name ||
                      (t.type === "transferencia" ? "Transferência" : "Lançamento")}
                  </span>
                  <span className="txlist__item-sub">
                    {t.type === "transferencia"
                      ? `${state.accounts.find((a) => a.id === t.fromAccountId)?.name} → ${state.accounts.find((a) => a.id === t.toAccountId)?.name}`
                      : state.categories.find((c) => c.id === t.categoryId)?.name}
                  </span>
                </div>
                <span className={`txlist__amount txlist__amount--${t.type}`}>
                  {t.type === "transferencia"
                    ? formatMoney(t.amount, currency)
                    : formatMoney(signed(t), currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <TypeFilterMenu
        open={menuOpen}
        value={filter}
        onSelect={setFilter}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Implement `TransactionsScreen.css`**

```css
.txlist {
  padding: 16px 20px 96px;
}
.txlist__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.txlist__filter {
  padding: 8px 18px;
  border: 0;
  border-radius: 999px;
  background: var(--color-surface-2, #2a2a30);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.txlist__month {
  color: var(--color-text-muted, #9a9aa3);
}
.txlist__totals {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 16px 0;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface, #1a1a1f);
}
.txlist__totals span {
  display: block;
  font-size: 13px;
  color: var(--color-text-muted, #9a9aa3);
}
.txlist__day-head {
  margin: 20px 0 8px;
  font-size: 14px;
  color: var(--color-text-muted, #9a9aa3);
}
.txlist__items {
  list-style: none;
  margin: 0;
  padding: 0;
}
.txlist__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-divider, #2a2a30);
}
.txlist__item-sub {
  display: block;
  font-size: 13px;
  color: var(--color-text-muted, #9a9aa3);
}
.txlist__amount--despesa,
.txlist__amount--despesa-cartao {
  color: var(--color-expense, rgb(229, 72, 77));
}
.txlist__amount--receita {
  color: var(--color-income, rgb(43, 174, 163));
}
.txlist__amount--transferencia {
  color: var(--color-text, #fff);
}
.txlist__empty {
  margin-top: 32px;
  text-align: center;
  color: var(--color-text-muted, #9a9aa3);
}
```

- [ ] **Step 4: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/screens/transactions/TransactionsScreen.tsx src/screens/transactions/TransactionsScreen.css src/screens/transactions/TypeFilterMenu.tsx
git commit -m "feat: transactions screen with type filter"
```

---

## Task 20: Wire Accounts & Transactions into navigation

**Files:**
- Modify: `src/App.tsx`, `src/components/Sidebar.tsx`

- [ ] **Step 1: Render Transactions on the `transacoes` tab (mobile)**

In `src/App.tsx`, replace the `Placeholder` for the `transacoes` tab with the real screen:

```tsx
{tab === "principal" ? (
  <HomeScreen /* ...existing props */ />
) : tab === "transacoes" ? (
  <TransactionsScreen groupId={groupId} month={month} year={year} monthLabel={monthLabel} />
) : tab === "mais" ? (
  <AccountsScreen />
) : (
  <Placeholder tab={tab} />
)}
```

Add imports:

```tsx
import { AccountsScreen } from "@/screens/accounts/AccountsScreen";
import { TransactionsScreen } from "@/screens/transactions/TransactionsScreen";
```

- [ ] **Step 2: Add a desktop entry point for Contas**

Read `src/components/Sidebar.tsx`. Add a `Contas` nav item that calls a new `onOpenAccounts` prop, and in `App.tsx` render `AccountsScreen` in a `Presentation` modal (desktop) when triggered. Minimal approach: add a `desktopView` state in `App.tsx`:

```tsx
const [desktopView, setDesktopView] = useState<"dashboard" | "accounts" | "transactions">("dashboard");
```

Render in the `desktop-only` block:

```tsx
{desktopView === "accounts" ? (
  <AccountsScreen />
) : desktopView === "transactions" ? (
  <TransactionsScreen groupId={groupId} month={month} year={year} monthLabel={monthLabel} />
) : (
  <DashboardDesktop /* ...existing props */ />
)}
```

Wire the Sidebar items (`Dashboard`, `Transações`, `Contas`) to `setDesktopView("dashboard" | "transactions" | "accounts")`.

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`
Manual check:
- Mobile (narrow window): bottom nav `Transações` shows the list with a working type-filter pill; `Mais` shows Contas.
- Desktop (wide window): sidebar `Transações` and `Contas` switch the main panel.
- Add a transaction → it appears in the Transactions list for the right month/group and adjusts Home/Dashboard balances.

- [ ] **Step 4: Type-check + commit**

Run: `npx tsc -b` (expect no errors)

```bash
git add src/App.tsx src/components/Sidebar.tsx
git commit -m "feat: wire accounts and transactions screens into navigation"
```

---

## Task 21: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all suites pass (expand, reducer, selectors).

- [ ] **Step 2: Run the type/lint check**

Run: `npx tsc -b && npm run check`
Expected: no type errors; Biome reports clean (fix any issues it flags).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual smoke (all flows)**

Run: `npm run dev` and confirm:
- Create each of the 4 transaction types; balances/invoices/summary update.
- Card expense with 3 parcelas splits across 3 invoices (check via Transactions filter Despesas).
- Recurring account expense shows the current month occurrence (and future months when navigating).
- Reajuste de saldo: both modes reach the target.
- Type filter on Transactions narrows the list; totals update.

- [ ] **Step 5: Final commit (if any cleanup)**

```bash
git add -A
git commit -m "chore: cleanup after transaction form round"
```

---

## Notes for the implementer

- **Token/keypad amount entry:** `AmountInput` treats typed digits as cents. This matches the Mobills numeric entry feel and avoids float parsing bugs.
- **Currency per group:** never add a currency selector. Always derive via `resolveGroup(groupId).currency`.
- **Adjustments excluded from month income/expense:** they only move account balances; `monthIncome`/`monthExpense` skip `adjustment` transactions by design.
- **CSS variables:** the snippets reference `--color-*` tokens. Inspect `src/styles/tokens.css` and use the actual token names; the fallbacks are only safety nets.
