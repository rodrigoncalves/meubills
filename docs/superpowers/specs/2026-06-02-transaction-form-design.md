# Design — Form de Lançamento, Reajuste de Saldo, Contas e Transações

Date: 2026-06-02
Status: Approved
Related: `DESIGN.md` § "New Transaction (+ button)"

## Goal

Build the transaction creation flow ("lançamento") on top of the existing
home + desktop dashboard, backed by an in-memory store so balances react to
user input. This round covers all four transaction types, a minimal Accounts
screen hosting a balance-adjustment ("Reajuste de saldo") flow, and a minimal
unified Transactions screen.

UI labels stay in pt-BR. Currency is inferred from the active financial group
(never selected in the form), per `DESIGN.md`.

## Scope

In scope:

- Transaction form for all four types: `Despesa`, `Receita`, `Despesa Cartão`,
  `Transferência`.
- In-memory store (React context + `useReducer`) with pure selectors. Saving a
  transaction mutates state; affected balances and totals update; a toast shows.
- Presentation: mobile full-screen, desktop centered modal.
- `Mais detalhes` complete: recurrence (account expense) and installments (card
  expense), with real effects on the store.
- Minimal **Accounts** screen (Contas) listing accounts per group with current
  balance, each opening a sheet with a `Reajustar saldo` action.
- **Reajuste de saldo** sheet (two modes: create adjustment transaction /
  modify initial balance).
- Minimal **Transactions** screen (Transações) listing transactions for the
  selected month + group, with a **type filter** (Todas / Despesas / Receitas /
  Transferências). No search / advanced filters yet.

Out of scope (future rounds):

- Transactions screen filters/search, editing/deleting transactions.
- Attachments persistence (`Anexo` field may render but stores nothing).
- Fully-derived summary (income/expense from a complete seeded ledger).
- Account creation/editing UI beyond balance adjustment.

## Data Model (`src/data/types.ts`)

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
  icon: string; // icon key
  color: string;
}

export type InvoiceStatus = "open" | "closed-pending" | "closed-paid";

export interface Invoice {
  id: string;
  cardId: string;
  month: number; // 0-11
  year: number;
  status: InvoiceStatus;
  // label NOT persisted — derived in presentation from month/year
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // always > 0
  groupId: string;
  date: string; // ISO date
  description?: string;

  // Source — depends on type:
  categoryId?: string; // despesa/receita/card (not transferência)
  accountId?: string; // despesa/receita
  fromAccountId?: string; // transferência
  toAccountId?: string; // transferência
  cardId?: string; // despesa-cartao
  invoiceId?: string; // despesa-cartao

  settled: boolean; // account tx: Pago/Recebido. Card tx: always true (into invoice).
  ignored: boolean; // "Ignorar transação"
  recurrence: Recurrence; // account expense; "none" otherwise
  installments?: number; // card expense (>=1)
  adjustment?: boolean; // created by Reajuste "criar transação de ajuste"
  seriesId?: string; // shared by installments / recurrence occurrences
  createdAt: string; // ISO timestamp
}
```

Notes:

- `Account` has no `kind` (irrelevant for this product). `includeInTotal`
  controls whether the account participates in the Home total.
- `Invoice.label` is derived in the presentation layer (e.g. `Fatura de julho
  de 2026`) from `month`/`year`; never persisted.

## Seed Data (`src/data/mock.ts`)

- **Accounts** per group. PF accounts with `includeInTotal: true` must sum to
  `1164.00` (the current Home "saldo atual em contas") so the derived Home
  balance reproduces today's approved visual.
- **Categories**: a small seeded set split by `kind`, plus a reserved `Ajuste`
  category used by the adjustment flow.
- **Invoices**: per card, the relevant open/closed months matching existing
  `cards` mock (C6, Mercado Pago, Nubank, Will Bank).
- Existing `summary` (balance/income/expense) and `cards` are kept as the
  **base** the deltas apply on top of (see Store).

## Store (`src/store/`)

`AppStateProvider` — React context + `useReducer`. Single source of truth for
the dynamic part of the app.

State: `groups`, `accounts`, `categories`, `cards`, `invoices`,
`transactions`, and a `baseSummary` (seeded income/expense baseline).

Actions:

- `ADD_TRANSACTION(tx)` — appends to `transactions`. Expansion rules:
  - Card expense with `installments > 1` → one transaction per consecutive
    invoice starting at the selected one (split evenly; remainder cents on the
    first installment). Each carries the same parent group/description.
  - Account expense with `recurrence !== "none"` → generate monthly occurrences
    over a bounded rolling horizon of 12 months (including the original month),
    one transaction per month on the same day-of-month. ("fixed" and "monthly"
    use the same generation in this round; the distinction is stored for future
    UI/semantics.)
  - Otherwise a single transaction is appended.
  - All expanded children share a `seriesId` so they can be grouped/edited
    together later.
- `ADJUST_BALANCE({ accountId, targetBalance, mode, description })`:
  - `mode: "create-tx"` → append an adjustment transaction (`adjustment: true`,
    category `Ajuste`, `amount = |diff|`, type `despesa`/`receita` by sign,
    `settled: true`, date today). Current balance becomes the target.
  - `mode: "modify-initial"` → `account.initialBalance += diff`. No transaction.

### Selectors (`src/store/selectors.ts`, pure, unit-tested)

- `accountBalance(state, accountId)` = `initialBalance` + Σ settled account
  transactions touching it (despesa `−`, receita `+`, transferência out `−` /
  in `+`, ajuste by sign).
- `groupAccounts(state, groupId)`.
- `homeBalance(state, groupId)` = Σ `accountBalance` over group accounts where
  `includeInTotal`. Drives Hero "saldo atual" and the Dashboard "saldo" card.
- `monthIncome` / `monthExpense(state, groupId, month, year)` = `baseSummary`
  value + Σ deltas from non-ignored, non-adjustment transactions matching
  group + month + type.
- `invoiceAmount(state, invoiceId)` = base invoice amount + Σ card transactions
  assigned to that invoice.
- `invoiceLabel(month, year)` → `Fatura de <mês> de <ano>` (presentation
  helper).
- `groupTransactions(state, groupId, month, year, filter)` — for the
  Transactions screen, sorted by date desc. `filter` is
  `"all" | "despesa" | "receita" | "transferencia"`:
  - `all` → every type.
  - `despesa` → `despesa` **and** `despesa-cartao`.
  - `receita` → `receita`.
  - `transferencia` → `transferencia`.

This is a deliberate hybrid: `homeBalance` is fully derived from accounts (so it
reacts to every transaction and to Reajuste), while income/expense use
`base + delta` to avoid seeding a full synthetic ledger. It can migrate to fully
derived later without changing consumers' call sites.

## UI Components

### Presentation wrapper

`Presentation` (or `FormShell`) renders children as a full-screen overlay on
mobile and a centered modal on desktop (breakpoint matching existing desktop
shell). Used by `TransactionForm`.

### `TransactionForm`

- Header: `Cancelar` (left) + type pill `TypeSwitcher` (Despesa ▾ / Receita ▾ /
  Desp. Cartão ▾). `Transferência` is entered only via the Novo menu and is not
  in the switcher.
- `AmountInput`: large `R$ 0,00`, currency from group, validation
  `Deve ter um valor diferente de 0`.
- Fields: `Grupo` (default = active Home group), date chips
  `Hoje / Ontem / Outros…` (+ date picker), `Descrição` (optional),
  `Categoria` (default `Despesa comum`), source:
  - Despesa/Receita → `Conta` (group accounts only).
  - Despesa Cartão → `Cartão` (group cards) + `Fatura` (derived labels).
  - Transferência → `De` / `Para` accounts (must differ).
- `Pago` / `Recebido` toggle (account only; default on, off when date is
  future). Card tx: no toggle.
- `Ignorar transação` toggle.
- `Mais detalhes` (expand): recurrence (account expense) / installments (card
  expense).
- Buttons: `Salvar` (closes, toast `Lançamento salvo`, returns to origin) and
  `Salvar e criar nova` (clears fields, keeps open).

### `AccountsScreen` (Contas, minimal)

- List of accounts grouped by financial group, each row showing current
  `accountBalance`.
- Tap row → `AccountSheet` with a `Reajustar saldo` action.
- Entry points: sidebar item (desktop) + Mais (mobile).

### `BalanceAdjustSheet` (Reajuste de saldo)

Matches the Mobills reference:

- Target amount field `R$ 0,00`.
- Reference line `Saldo inicial da conta` + value.
- `Você gostaria de…` two option cards: `CRIAR TRANSAÇÃO DE AJUSTE` /
  `MODIFICAR SALDO INICIAL` (with the explanatory copy).
- `Descrição` (optional).
- `CANCELAR` / `SALVAR`.
- `diff = target − currentBalance`; if `diff === 0`, `SALVAR` disabled.

### `TransactionsScreen` (Transações, minimal)

- Top **type filter** pill (e.g. `Despesas ▾`) opens a menu with `Todas as
  transações`, `Despesas`, `Receitas`, `Transferências`, each with its tone dot
  (all = group accent, despesa = expense red, receita = income green,
  transferência = blue). Selection drives the `filter` argument; the pill tints
  to the active type.
- Month navigator (`‹ Junho ›`) shares the app's selected month/group.
- Lists `groupTransactions(group, month, year, filter)` grouped by day
  (`Segunda-feira, 15`), sorted by date desc. Rows show category · account
  subtitle, installment marker (`(2/3)`), and signed amount in the type tone.
  Transfer rows render two-sided (`De → Para`, neutral tone).
- Header totals scoped to the active filter: `Total pendente` (unsettled) and
  `Total pago` (settled) for despesa/receita views; for `Todas`, show the net
  month figures. (Minimal — derived from the filtered list.)
- No search this round.

### Shared `PickerSheet`

Sub-selectors (grupo, categoria, conta, cartão, fatura) render as a bottom sheet
on mobile and a small modal/popover on desktop.

### `Toast`

App-root toast host for `Lançamento salvo` / `Saldo reajustado`.

## Wiring

- Wrap app in `AppStateProvider`.
- `handleNewAction(action)` opens `TransactionForm` with the chosen initial type
  (replacing the current `console.log` TODO in `App.tsx`).
- Add Contas + Transações entries to sidebar (desktop) and Mais/bottom nav
  (mobile) as appropriate.
- Home (`Hero`, `CardsSection`) and `DashboardDesktop` read derived values from
  selectors instead of static mock constants.

## Validation & Error Handling

- `Valor` hard-required, must differ from 0 → inline validation, blocks save.
- Transferência: `De` ≠ `Para` required.
- Reajuste: `diff === 0` disables `SALVAR`.

## Testing

Vitest unit tests for selectors and reducer logic (the risk-bearing core):

- `accountBalance` across all transaction kinds (incl. ignored/unsettled
  exclusion).
- `homeBalance` honoring `includeInTotal`.
- `monthIncome` / `monthExpense` base + delta, month/group filtering.
- Reajuste both modes (create-tx vs modify-initial) reach the target balance.
- Card installments split across consecutive invoices (even split + remainder
  cents on first).
- Recurrence occurrence generation for account expenses.
