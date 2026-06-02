# Design

## Overview

MeuBills is a dark-theme product UI for an offline-first personal/professional finance PWA. The interface should be dense enough for repeated work, vivid enough to feel close to Mobills, and distinct through group-aware multi-currency patrimonio.

## Theme

Dark theme by default. Scene: the user reviews finances on a phone or notebook at night or during a focused work break, checking net worth, pending bills, and card invoices without wanting glare or visual noise.

The theme is dark, but never pure black. Surfaces use tinted neutrals with enough contrast for long reading and compact data.

The mobile visual reference is the attached Mobills screenshot. MeuBills should feel familiar enough that a Mobills user can continue using the same mental model: month-centered home, large current balance, income/expense pair, pending cards, credit-card section, bottom navigation, and central create button.

## Color Strategy

Mobills-like dark product palette with semantic accents inspired by the screenshot reference: charcoal surfaces, violet primary action, teal progress/accent, green income, red expense, and compact colored financial indicators.

Use RGB/HEX as the source of truth so the palette is easy to review and tune.

- App background: `rgb(28, 28, 30)` / `#1c1c1e`
- Hero surface: `rgb(32, 32, 34)` / `#202022`
- Card surface: `rgb(34, 34, 36)` / `#222224`
- Raised card surface: `rgb(39, 39, 42)` / `#27272a`
- Bottom nav selected surface: `rgb(58, 58, 61)` / `#3a3a3d`
- Border: `rgb(53, 53, 56)` / `#353538`
- Text primary: `rgb(245, 245, 247)` / `#f5f5f7`
- Text secondary: `rgb(168, 168, 176)` / `#a8a8b0`
- Text muted: `rgb(125, 125, 134)` / `#7d7d86`
- Primary action: `rgb(108, 35, 224)` / `#6c23e0`
- Primary action raised: `rgb(126, 71, 226)` / `#7e47e2`
- Teal accent: `rgb(43, 174, 163)` / `#2baea3`
- Info: `rgb(66, 156, 235)` / `#429ceb`
- Warning: `rgb(245, 184, 66)` / `#f5b842`
- Expense: `rgb(255, 80, 80)` / `#ff5050`
- Income: `rgb(54, 211, 93)` / `#36d35d`
- Balance: `rgb(66, 150, 235)` / `#4296eb`
- Credit: `rgb(43, 174, 163)` / `#2baea3`

Usage rules:

- Primary action violet is for floating create actions, selected nav, links, and primary commands.
- Teal is for progress bars, active segmented controls, and card/payment accents.
- Income is green, expense is red, balance/net-worth is blue, and credit/card status is teal.
- Currency identity should be subtle: BRL, USD, and BTC can use small chips, icons, labels, or compact group markers, not full-surface color blocks.
- Negative values need both color and sign/icon treatment.
- Stale exchange rates use warning semantics only when action is useful. Otherwise show clear timestamp copy.

## Group Identity

Financial groups need visual segregation in the dashboard and reports. A group is not just a filter; it has a small visual identity that helps the user know which financial world they are viewing.

Each group can define:

- Name, such as PF, PJ, Dolar, Bitcoin, Investimentos, Exterior.
- Icon from the app icon set.
- Accent color from a constrained palette.
- Default currency or primary asset.
- Optional short description.

Group accents should appear in:

- Group switcher.
- Dashboard section header.
- Small chips on account, card, and report rows.
- Chart legends.
- Empty states.
- Consolidated patrimonio breakdown.

Group accents must stay secondary to semantic financial colors. For example, a PJ group can be violet, but an expense inside PJ is still red.

## Typography

Primary UI font is **Maven Pro** (matches the Mobills reference), with a system UI fallback:

```css
font-family: "Maven Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
```

Type should feel native, efficient, and unshowy.

- Body: 14px to 16px depending on density.
- Data labels: 12px to 13px, medium weight.
- Section headings: 16px to 20px, semibold.
- Page headings: 22px to 28px, semibold.
- Numeric financial values: tabular numbers where available.

Do not use display fonts for UI labels, buttons, or financial data.

## Layout

Mobile first, because the PWA is a primary surface.

- Mobile navigation: bottom nav with Principal, Transações, central +, Cartões, Mais.
- Desktop navigation: collapsible/expandable sidebar with Novo, Dashboard, Contas, Transações, Cartões de crédito, Relatórios, Mais opções, Configurações.
- First screen: group-aware dashboard with patrimonio multi-moeda, operational summary, and credit card status.
- Layout density should support scanning without turning into a spreadsheet.
- Cards are allowed for repeated financial objects, but page sections should not become nested card stacks.
- It is acceptable for the dashboard to feel close to Mobills in structure and rhythm, as long as the implementation uses original assets, original component code, and MeuBills-specific group/multi-currency behavior.

Group behavior:

- The app must always have at least one financial group.
- First-use group is PF.
- The app opens the last active group.
- Consolidado appears as a special selector item, not as a persisted group.
- The top-left group chip/avatar changes the active group through a bottom sheet.
- Group creation/editing lives in Mais > Configurações > Grupos financeiros, not in daily transaction/account/card flows.

## Mobile Home Reference

The mobile home should copy the familiar Mobills disposition closely:

- Status-safe top area with active group chip/avatar on the left, centered month selector, and action/reward/profile shortcut on the right.
- Large rounded hero block occupying the top viewport.
- Hero content order: month selector, `Saldo atual em contas`, large BRL balance, visibility toggle, then Receitas and Despesas side by side.
- Income/expense pair uses large circular icons, label above value, green/red values.
- Section title `Pendências e alertas`.
- Two-column alert cards for `Despesas pendentes` and `Faturas fechadas`, each with icon, count badge, label, and value.
- Section title `Cartões de crédito` with compact view/action icon on the right.
- Large card panel with segmented control: `Faturas abertas` and `Faturas fechadas`.
- Credit-card rows with a generic card icon, card name, short date text, invoice amount, available limit, row divider, and contextual action.
- Persistent bottom navigation with selected pill on `Principal`, labels under icons, and oversized centered violet `+` button.
- Mobile page background should remain visible around cards. Cards use large radius, soft shadow, and no visible heavy borders.

Suggested mobile spacing:

- Screen horizontal padding: 24px to 28px.
- Hero radius: 32px to 40px.
- Cards radius: 28px to 34px.
- Bottom nav height: 88px to 104px plus safe area.
- Central action button: 68px to 76px.
- Hero balance: 52px to 64px on common phone widths, with tabular numbers.

Dashboard sections should include:

- Month selector.
- Summary cards: saldo atual, receitas, despesas, cartão de crédito.
- Group selector or group tabs for PF, PJ, Dolar, Bitcoin, and other configured groups.
- Despesas por categoria donut chart.
- Balanço mensal panel with receitas, despesas, and balance.
- Credit card panel with open/closed invoices, short date labels, invoice amounts, available limits, contextual actions, and total.
- Compact links such as `Ver mais` and `Meu desempenho` where they lead to deeper reports.

On mobile, prefer the Mobills home structure over the desktop summary-card row. The desktop can adapt the same content into a wider dashboard.

Credit-card home rules:

- Show all cards on the Home, ordered alphabetically by displayed name.
- Users can control order by adding numeric prefixes to card names, such as `1. Nubank`.
- Do not show card brand/bandeira on the Home.
- `Faturas abertas` rows show `Fecha em 29/jun.`, invoice amount, `Limite disponível R$ ...`, and a `+` action.
- `Faturas fechadas` rows show `Vence em 05/jun.`, invoice amount, `Limite disponível R$ ...`, and `Pagar` when payment is pending.
- Paid closed invoices show `Fatura paga` and no primary action.
- Do not show limit bars or percentages on the Home.
- Show `TOTAL` in the section footer.
- Tapping a card row opens the current month invoice detail.

## Components

Core components:

- App shell with responsive nav.
- Financial group switcher.
- Financial group identity chip.
- Currency-aware amount display.
- Account and wallet rows.
- Transaction list with filters.
- Credit card and invoice summaries.
- Report panels.
- Sync status indicator.
- Exchange-rate timestamp indicator.
- Confirmation dialog for logout and local data clearing.

Every interactive component needs default, hover, focus, active, disabled, loading, and error states.

## Motion

Motion should communicate state only.

- Use 150ms to 250ms transitions.
- Prefer opacity and transform transitions.
- Respect reduced motion.
- Avoid decorative page-load choreography.

## Copy

Copy should be direct, operational, and written in Portuguese Brazilian (pt-BR). UI strings should use accents, Brazilian date/currency conventions, and familiar financial vocabulary.

Examples:

- `Atualizada às HH:MM`
- `Atualizada em DD/MM às HH:MM`
- `Sincronização pendente`
- `Dados locais apagados ao sair`
- `Fatura aberta`
- `Fatura fechada`
- `Fatura paga`
- `Cartão de crédito`
- `Lançamentos`
- `Relatórios`
- `Principal`
- `Transações`
- `Cartões`
- `Mais`
- `Dashboard`
- `Contas`
- `Mais opções`
- `Configurações`
- `Grupos financeiros`
- `Pendências e alertas`
- `Despesas pendentes`
- `Faturas abertas`
- `Faturas fechadas`
- `Limite disponível`
- `Pagar`
- `Fecha em 29/jun.`
- `Vence em 05/jun.`

No em dashes. Avoid restating headings.

## New Transaction (+ button)

Transaction creation flow triggered by the central `+` button in the bottom nav. Visual reference: Mobills (close clone), with the key difference that currency is inferred from the financial group, not selected in the form. UI labels stay in pt-BR (the app language).

### Entry

- The central `+` opens a **quick-action bottom sheet** (revisable decision; Mobills uses a radial fan-out menu, but the current decision is a bottom sheet).
- Sheet actions, in this order: `Despesa`, `Receita`, `Despesa Cartão`, `Transferência`.
- The chosen action defines the transaction source:
  - `Despesa` and `Receita` → source is an **account/wallet**.
  - `Despesa Cartão` → source is a **credit card** (with invoice selection).
  - `Transferência` → between two accounts/wallets.
- There is no unified account vs card selector. The source comes from the action.

### Transaction screen

- Single screen for all types, with a **type switcher** at the top (pill `Despesa ▾` / `Receita ▾` / `Desp. Cartão ▾`) that switches the type without leaving the screen.
- Mobile header: `Cancelar` on the left, type pill at the top/center.
- Amount featured at the top: `R$ 0,00`, with validation `Deve ter um valor diferente de 0`.
- **No currency selector.** Currency is inferred from the selected financial group.
- **Group** field in the form (PF, PJ, USD, BTC, etc.):
  - Default = active group from the Home, editable in the form.
  - Changing the group changes the displayed currency and filters the sources.
- Quick date: chips `Hoje` / `Ontem` / `Outros...`.
- `Descrição` (optional).
- `Categoria` (default `Despesa comum`).
- Source:
  - Despesa/Receita: **Conta** field (lists only accounts in the selected group).
  - Despesa Cartão: **Cartão** field (lists only cards in the group) + **Fatura** field (e.g. `Fatura 2 de julho de 2026`).
- `Anexo` (mobile).
- `Ignorar transação` (toggle, where applicable).
- `Mais detalhes` expands advanced fields (recurrence, installments, etc.).

### Status (settled)

- Account transaction: `Pago` / `Recebido` toggle.
  - Default **on** (settled), but **off when the date is in the future** (initial inference).
- Card transaction: no `Pago` toggle; goes straight into the selected invoice.

### Recurrence and installments

- **Installments** available on **card** expenses (e.g. 3x).
- **Recurrence** (fixed/monthly) available on **account** expenses.
- Both in the MVP, reachable via `Mais detalhes`.

### After saving

- Primary `Salvar` button: closes and **returns to origin** (Home or the screen it opened from), with a `Lançamento salvo` toast and the balance already updated.
- Secondary `Salvar e criar nova` button: keeps the screen open, clears fields for sequential entry.

### Required fields

- `Valor` (hard-required, with visible validation).
- `Grupo`, `Conta/Cartão`, `Data`, `Categoria`, and `Fatura` (card): always present via defaults, adjustable.
- `Descrição`: optional.
