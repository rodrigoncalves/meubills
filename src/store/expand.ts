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
