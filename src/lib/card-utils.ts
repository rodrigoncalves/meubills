import type { Invoice } from "@/data/types";

const FULL_MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "29 de junho" — label for card rows (no year). */
export function formatDateLabel(day: number, month?: number): string {
  const m = month ?? new Date().getMonth();
  return `${day} de ${FULL_MONTHS[m]}`;
}

/** "29 de junho" — full closing label for invoice hero (no year). */
export function formatClosingLabel(day: number, month?: number): string {
  const m = month ?? new Date().getMonth();
  return `${day} de ${FULL_MONTHS[m]}`;
}

/** "5 de julho" — full due label for invoice hero (no year, month after closing). */
export function formatDueLabel(day: number, closingMonth?: number): string {
  const closingM = closingMonth ?? new Date().getMonth();
  const dueM = (closingM + 1) % 12;
  return `${day} de ${FULL_MONTHS[dueM]}`;
}

/** "2 de junho de 2026" — full date with month and year. */
export function formatDateLong(day: number, month: number, year: number): string {
  return `${day} de ${FULL_MONTHS[month]} de ${year}`;
}

/**
 * Compute invoice status from card's closingDay and paid flag.
 *
 * Cycle logic:
 * - Before closing day: current month's invoice is still open
 * - On or after closing day: current month's invoice closes, next month opens
 *
 * - paid → "paid"
 * - invoice matches the open cycle → "open"
 * - invoice before the open cycle → "closed"
 */
export function getInvoiceStatus(
  invoice: { month: number; year: number; paid: boolean },
  closingDay: number,
): "open" | "closed" | "paid" {
  if (invoice.paid) return "paid";

  const today = new Date();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const todayDay = today.getDate();

  // Which invoice cycle is currently open?
  // Before closing day → this month. On/after closing day → next month.
  const openMonth =
    todayDay < closingDay ? todayMonth : (todayMonth + 1) % 12;
  const openYear =
    todayDay < closingDay
      ? todayYear
      : todayMonth === 11
        ? todayYear + 1
        : todayYear;

  // Normalize to absolute month index for comparison
  const invKey = invoice.year * 12 + invoice.month;
  const openKey = openYear * 12 + openMonth;

  if (invKey === openKey) return "open";
  if (invKey < openKey) return "closed";

  // Future invoices beyond the open cycle (shouldn't normally exist)
  return "closed";
}

/**
 * Check whether an open invoice is past its due date.
 *
 * - Invoice must be "open" per getInvoiceStatus
 * - Due date = dueDay of the month after the invoice month
 * - Returns true when today > due date
 */
export function isInvoiceOverdue(
  invoice: { month: number; year: number; paid: boolean },
  closingDay: number,
  dueDay: number,
): boolean {
  if (getInvoiceStatus(invoice, closingDay) !== "open") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueMonth = (invoice.month + 1) % 12;
  const dueYear = invoice.year + (invoice.month === 11 ? 1 : 0);
  const dueDate = new Date(dueYear, dueMonth, dueDay);
  return today > dueDate;
}

/** "3 de junho de 2026" from ISO date "2026-06-03". */
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${FULL_MONTHS[m - 1]} de ${y}`;
}

/** Generate N consecutive monthly invoices starting from the given month/year. */
export function generateInvoices(
  cardId: string,
  startMonth: number,
  startYear: number,
  count: number,
): Invoice[] {
  const invoices: Invoice[] = [];
  let m = startMonth;
  let y = startYear;
  for (let i = 0; i < count; i++) {
    const monthName = FULL_MONTHS[m].slice(0, 3).toLowerCase();
    invoices.push({
      id: `inv-${cardId}-${monthName}-${y}`,
      cardId,
      month: m,
      year: y,
      paid: false,
    });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return invoices;
}
