# System Design

Behavioral and data spec for MeuBills. Complements DESIGN.md (UI/visual). Focus: rules, flows, and logic, not pixels. UI labels are shown in pt-BR (the app language); prose is in English.

## Financial groups

- The app always has at least one group. First use creates/uses `PF`.
- The app opens in the last active group used.
- `Consolidado` is a special selector view, not a persisted group.
- Each group defines: name, icon, accent color, primary currency/asset, optional description.
- Group switching via the chip/avatar at the top left of the Home (opens a bottom sheet).
- Group management lives in `Mais > Configurações > Grupos financeiros`.

## New Transaction (+ button)

Central data-entry flow. Close clone of Mobills, with currency derived from the group.

### Trigger and actions

- The central `+` opens a quick-action bottom sheet (revisable).
- Actions: `Despesa`, `Receita`, `Despesa Cartão`, `Transferência`.
- The action determines the source type:
  - `Despesa` / `Receita` → account/wallet.
  - `Despesa Cartão` → credit card + invoice.
  - `Transferência` → source account → destination account.
- No unified account/card selector; the source follows from the chosen action.
- The screen lets the type be switched via the top pill without reopening.

### Group field and currency

- The form has a `Grupo` field (PF, PJ, USD, BTC, etc.).
- Default = active group from the Home; editable in the form.
- **Currency is inferred from the group** (the group's primary currency/asset). There is no currency selector in the form.
- Changing the group in the form:
  - Updates the currency shown on the amount.
  - Re-filters the source lists (see below).
- When the Home is in `Consolidado` (not a real group), the form opens with **PF as the default group**, editable.

### Source filtering by group

- The `Conta` and `Cartão` lists in the form show **only** items belonging to the selected group.
- Changing the group in the form updates these lists immediately.
- Goal: keep financial worlds separated and prevent logging in the wrong place.

### Validation and fields

- `Valor`: hard-required. Rule: must be different from 0 (`Deve ter um valor diferente de 0`).
- `Grupo`: always filled (default active group / PF in Consolidado).
- `Data`: default `Hoje` (Hoje/Ontem/Outros chips).
- `Categoria`: default `Despesa comum`.
- `Conta` (expense/income) or `Cartão` + `Fatura` (card expense): filled via default (last used in the group).
- `Descrição`: optional.
- `Anexo`, `Ignorar transação`: optional.

### Settlement status

- Account transactions have a `Pago` (expense) / `Recebido` (income) toggle:
  - Initial rule: on by default.
  - **Exception**: if the transaction date is in the future, it starts off (pending).
  - The user can override the toggle manually.
  - Settled (toggle on) affects the account balance on the date; pending does not affect the balance until settled.
- Card transactions have no `Pago` toggle. They enter the selected invoice; balance impact happens when the invoice is paid.

### Recurrence and installments (MVP)

- **Installments**: available on `Despesa Cartão` (e.g. 3x). Generates entries/distribution across the matching invoices.
- **Recurrence**: available on **account** expenses (fixed/monthly). Generates a series of future entries.
- Both reachable via `Mais detalhes`.
- Recurrence does not apply to cards in the MVP; installments do not apply to accounts in the MVP.

### Persistence and post-save

- Primary `Salvar` button:
  - Persists the transaction.
  - Updates balance/invoice according to status.
  - Closes and returns to **origin** (Home or the screen it opened from).
  - Shows a `Lançamento salvo` toast.
- Secondary `Salvar e criar nova` button:
  - Persists and keeps the screen open, clearing fields for the next entry.
  - Preserves sensible context (group, account/card, type) for sequential entry.

## Open questions / to decide later

- `+` entry style: bottom sheet (current) vs radial menu (clone). Revisable.
- UI detail for installments and recurrence in `Mais detalhes`.
- `Transferência` rules (double-entry balance, cross-group, currency conversion between groups).
- Currency behavior when an account/card in the group has a currency different from the group's primary currency.
