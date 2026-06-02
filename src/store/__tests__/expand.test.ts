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
