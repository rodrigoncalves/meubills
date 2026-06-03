import { describe, expect, it } from "vitest";
import type { Transaction } from "@/data/types";
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
      tx({
        id: "t",
        type: "transferencia",
        amount: 50,
        fromAccountId: "pf-cc",
        toAccountId: "pf-wallet",
      }),
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
      tx({
        id: "3",
        type: "despesa-cartao",
        date: "2026-06-03",
        cardId: "nu",
        invoiceId: "inv-nu-jun",
      }),
      tx({
        id: "4",
        type: "transferencia",
        date: "2026-06-04",
        fromAccountId: "pf-cc",
        toAccountId: "pf-wallet",
      }),
    ];
    expect(groupTransactions(state, "pf", 5, 2026, "despesa").map((t) => t.id)).toEqual(["3", "1"]);
    expect(groupTransactions(state, "pf", 5, 2026, "all").map((t) => t.id)).toEqual([
      "4",
      "3",
      "2",
      "1",
    ]);
    expect(groupTransactions(state, "pf", 5, 2026, "transferencia").map((t) => t.id)).toEqual([
      "4",
    ]);
  });
});
