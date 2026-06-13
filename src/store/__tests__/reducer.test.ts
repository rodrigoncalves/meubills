import { describe, expect, it } from "vitest";
import { ADJUST_INCOME_CATEGORY } from "@/data/mock";
import { appReducer, buildInitialState } from "@/store/reducer";
import type { NewCreditCardInput, NewTransactionInput } from "@/store/types";

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

describe("appReducer DELETE_TRANSACTION", () => {
  it("removes the transaction with the given id", () => {
    const state = buildInitialState();
    const after = appReducer(state, {
      kind: "ADD_TRANSACTION",
      input: baseExpense(),
    });
    const id = after.transactions.at(-1)!.id;
    const final = appReducer(after, { kind: "DELETE_TRANSACTION", id });
    expect(final.transactions.find((t) => t.id === id)).toBeUndefined();
    expect(final.transactions).toHaveLength(state.transactions.length);
  });

  it("leaves other transactions untouched", () => {
    const state = buildInitialState();
    const s1 = appReducer(state, { kind: "ADD_TRANSACTION", input: baseExpense() });
    const s2 = appReducer(s1, { kind: "ADD_TRANSACTION", input: baseExpense() });
    const idToDelete = s2.transactions.at(-2)!.id;
    const final = appReducer(s2, { kind: "DELETE_TRANSACTION", id: idToDelete });
    expect(final.transactions).toHaveLength(s1.transactions.length);
    expect(final.transactions.find((t) => t.id === idToDelete)).toBeUndefined();
  });
});

describe("appReducer UPDATE_TRANSACTION", () => {
  // 12 monthly occurrences sharing a seriesId, dates 2026-06-10 .. 2027-05-10.
  function withSeries() {
    const state = buildInitialState();
    const next = appReducer(state, {
      kind: "ADD_TRANSACTION",
      input: { ...baseExpense(), recurrence: "monthly" },
    });
    const series = next.transactions;
    return { state: next, series };
  }

  it("scope 'one' on a standalone transaction updates its fields", () => {
    const state = buildInitialState();
    const added = appReducer(state, { kind: "ADD_TRANSACTION", input: baseExpense() });
    const id = added.transactions.at(-1)!.id;
    const next = appReducer(added, {
      kind: "UPDATE_TRANSACTION",
      id,
      scope: "one",
      update: { amount: 123, date: "2026-06-15", description: "Novo", settled: false, ignored: false },
    });
    const tx = next.transactions.find((t) => t.id === id)!;
    expect(tx.amount).toBe(123);
    expect(tx.date).toBe("2026-06-15");
    expect(tx.description).toBe("Novo");
    expect(tx.settled).toBe(false);
  });

  it("scope 'one' on a series member touches only that occurrence", () => {
    const { state, series } = withSeries();
    const target = series[5];
    const next = appReducer(state, {
      kind: "UPDATE_TRANSACTION",
      id: target.id,
      scope: "one",
      update: { amount: 99, date: target.date, settled: target.settled, ignored: false },
    });
    expect(next.transactions.find((t) => t.id === target.id)!.amount).toBe(99);
    const others = next.transactions.filter((t) => t.id !== target.id);
    expect(others.every((t) => t.amount === 50)).toBe(true);
  });

  it("scope 'future' updates the target and later occurrences only", () => {
    const { state, series } = withSeries();
    const target = series[5]; // 2026-11-10
    const next = appReducer(state, {
      kind: "UPDATE_TRANSACTION",
      id: target.id,
      scope: "future",
      update: { amount: 99, date: target.date, settled: target.settled, ignored: false },
    });
    for (const orig of series) {
      const t = next.transactions.find((x) => x.id === orig.id)!;
      expect(t.amount).toBe(orig.date >= target.date ? 99 : 50);
    }
  });

  it("scope 'all' updates every occurrence in the series", () => {
    const { state, series } = withSeries();
    const target = series[5];
    const next = appReducer(state, {
      kind: "UPDATE_TRANSACTION",
      id: target.id,
      scope: "all",
      update: { amount: 99, date: target.date, settled: target.settled, ignored: false },
    });
    expect(next.transactions.every((t) => t.amount === 99)).toBe(true);
  });

  it("does not propagate date or settled to other occurrences", () => {
    const { state, series } = withSeries();
    const target = series[5];
    const next = appReducer(state, {
      kind: "UPDATE_TRANSACTION",
      id: target.id,
      scope: "all",
      update: { amount: 99, date: "2030-01-01", settled: false, ignored: false },
    });
    // target picks up the new date + settled
    const updatedTarget = next.transactions.find((t) => t.id === target.id)!;
    expect(updatedTarget.date).toBe("2030-01-01");
    expect(updatedTarget.settled).toBe(false);
    // others keep their own date/settled but get the new amount
    for (const orig of series) {
      if (orig.id === target.id) continue;
      const t = next.transactions.find((x) => x.id === orig.id)!;
      expect(t.date).toBe(orig.date);
      expect(t.settled).toBe(orig.settled);
      expect(t.amount).toBe(99);
    }
  });

  it("returns state unchanged when id not found", () => {
    const state = buildInitialState();
    const next = appReducer(state, {
      kind: "UPDATE_TRANSACTION",
      id: "missing",
      scope: "all",
      update: { amount: 1, date: "2026-06-10", settled: true, ignored: false },
    });
    expect(next).toBe(state);
  });
});

function baseCard(): NewCreditCardInput {
  return {
    groupId: "pf",
    name: "Test Card",
    totalLimit: 5000,
    closingDay: 15,
    dueDay: 25,
  };
}

describe("appReducer ADD_CREDIT_CARD", () => {
  it("adds a card and generates 6 invoices", () => {
    const state = buildInitialState();
    const next = appReducer(state, { kind: "ADD_CREDIT_CARD", input: baseCard() });
    expect(next.cards).toHaveLength(state.cards.length + 1);
    const card = next.cards.find((c) => c.name === "Test Card");
    expect(card).toBeDefined();
    expect(card!.groupId).toBe("pf");
    expect(card!.totalLimit).toBe(5000);
    expect(card!.invoiceAmount).toBe(0);
    expect(card!.closingDay).toBe(15);
    expect(card!.dueDay).toBe(25);
    // 6 invoices generated
    const cardInvoices = next.invoices.filter((inv) => inv.cardId === card!.id);
    expect(cardInvoices).toHaveLength(6);
    expect(cardInvoices[0].paid).toBe(false);
  });

  it("computes date labels from closingDay/dueDay", () => {
    const state = buildInitialState();
    const next = appReducer(state, { kind: "ADD_CREDIT_CARD", input: baseCard() });
    const card = next.cards.find((c) => c.name === "Test Card")!;
    expect(card.dateLabel).toBeTruthy();
    expect(card.closingLabel).toBeTruthy();
    expect(card.dueLabel).toBeTruthy();
  });

  it("handles missing closingDay/dueDay gracefully", () => {
    const state = buildInitialState();
    const next = appReducer(state, {
      kind: "ADD_CREDIT_CARD",
      input: { groupId: "pf", name: "Simple", totalLimit: 1000 },
    });
    const card = next.cards.find((c) => c.name === "Simple")!;
    expect(card.dateLabel).toBe("");
    expect(card.closingLabel).toBeUndefined();
    expect(card.dueLabel).toBeUndefined();
  });
});

describe("appReducer UPDATE_CREDIT_CARD", () => {
  it("updates card name", () => {
    const state = buildInitialState();
    const cardId = state.cards[0].id;
    const next = appReducer(state, {
      kind: "UPDATE_CREDIT_CARD",
      cardId,
      update: { name: "Renamed" },
    });
    expect(next.cards.find((c) => c.id === cardId)?.name).toBe("Renamed");
  });

  it("updates totalLimit", () => {
    const state = buildInitialState();
    const cardId = state.cards[0].id;
    const next = appReducer(state, {
      kind: "UPDATE_CREDIT_CARD",
      cardId,
      update: { totalLimit: 9999 },
    });
    expect(next.cards.find((c) => c.id === cardId)?.totalLimit).toBe(9999);
  });

  it("sets archived flag", () => {
    const state = buildInitialState();
    const cardId = state.cards[0].id;
    const next = appReducer(state, {
      kind: "UPDATE_CREDIT_CARD",
      cardId,
      update: { archived: true },
    });
    expect(next.cards.find((c) => c.id === cardId)?.archived).toBe(true);
  });

  it("links an account", () => {
    const state = buildInitialState();
    const cardId = state.cards[0].id;
    const next = appReducer(state, {
      kind: "UPDATE_CREDIT_CARD",
      cardId,
      update: { accountId: "pf-cc" },
    });
    expect(next.cards.find((c) => c.id === cardId)?.accountId).toBe("pf-cc");
  });

  it("does not affect other cards", () => {
    const state = buildInitialState();
    const cardId = state.cards[0].id;
    const otherId = state.cards[1].id;
    const next = appReducer(state, {
      kind: "UPDATE_CREDIT_CARD",
      cardId,
      update: { name: "Changed" },
    });
    expect(next.cards.find((c) => c.id === otherId)?.name).toBe(state.cards[1].name);
  });
});

describe("appReducer DELETE_CREDIT_CARD", () => {
  it("removes the card", () => {
    const state = buildInitialState();
    const cardId = state.cards[0].id;
    const next = appReducer(state, { kind: "DELETE_CREDIT_CARD", cardId });
    expect(next.cards.find((c) => c.id === cardId)).toBeUndefined();
    expect(next.cards).toHaveLength(state.cards.length - 1);
  });

  it("removes linked invoices", () => {
    const state = buildInitialState();
    const cardId = "nu"; // has invoices inv-nu-jun, inv-nu-jul
    const next = appReducer(state, { kind: "DELETE_CREDIT_CARD", cardId });
    const remaining = next.invoices.filter((inv) => inv.cardId === cardId);
    expect(remaining).toHaveLength(0);
  });

  it("removes baseInvoiceAmounts entries for deleted invoices", () => {
    const state = buildInitialState();
    const cardId = "nu";
    const next = appReducer(state, { kind: "DELETE_CREDIT_CARD", cardId });
    expect(next.baseInvoiceAmounts["inv-nu-jun"]).toBeUndefined();
  });

  it("removes linked transactions", () => {
    const state = buildInitialState();
    state.transactions = [
      {
        id: "tx1",
        type: "despesa-cartao",
        amount: 100,
        groupId: "pf",
        date: "2026-06-01",
        cardId: "nu",
        invoiceId: "inv-nu-jun",
        settled: true,
        ignored: false,
        recurrence: "none",
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ];
    const next = appReducer(state, { kind: "DELETE_CREDIT_CARD", cardId: "nu" });
    expect(next.transactions).toHaveLength(0);
  });

  it("leaves other data intact", () => {
    const state = buildInitialState();
    const cardId = state.cards[0].id;
    const next = appReducer(state, { kind: "DELETE_CREDIT_CARD", cardId });
    expect(next.groups).toEqual(state.groups);
    expect(next.accounts).toEqual(state.accounts);
    expect(next.categories).toEqual(state.categories);
    expect(next.baseSummaryByGroup).toEqual(state.baseSummaryByGroup);
  });
});

describe("appReducer PAY_INVOICE", () => {
  it("creates a payment transaction and marks invoice as paid", () => {
    const state = buildInitialState();
    const next = appReducer(state, {
      kind: "PAY_INVOICE",
      input: { invoiceId: "inv-nu-jun", accountId: "pf-cc", date: "2026-06-04", amount: 745.01 },
    });
    const inv = next.invoices.find((i) => i.id === "inv-nu-jun");
    expect(inv?.paid).toBe(true);
    expect(inv?.paymentTransactionId).toBeDefined();
    const paymentTx = next.transactions.find((t) => t.id === inv!.paymentTransactionId);
    expect(paymentTx).toBeDefined();
    expect(paymentTx!.type).toBe("despesa");
    expect(paymentTx!.amount).toBe(745.01);
    expect(paymentTx!.accountId).toBe("pf-cc");
  });

  it("does nothing if invoice already paid", () => {
    const state = buildInitialState();
    const s1 = appReducer(state, {
      kind: "PAY_INVOICE",
      input: { invoiceId: "inv-nu-jun", accountId: "pf-cc", date: "2026-06-04", amount: 745.01 },
    });
    const s2 = appReducer(s1, {
      kind: "PAY_INVOICE",
      input: { invoiceId: "inv-nu-jun", accountId: "pf-cc", date: "2026-06-05", amount: 745.01 },
    });
    expect(s2.transactions).toHaveLength(s1.transactions.length);
  });
});

describe("appReducer REOPEN_INVOICE", () => {
  it("reverses payment and marks invoice as unpaid", () => {
    const state = buildInitialState();
    const paid = appReducer(state, {
      kind: "PAY_INVOICE",
      input: { invoiceId: "inv-nu-jun", accountId: "pf-cc", date: "2026-06-04", amount: 745.01 },
    });
    const reopened = appReducer(paid, { kind: "REOPEN_INVOICE", invoiceId: "inv-nu-jun" });
    const inv = reopened.invoices.find((i) => i.id === "inv-nu-jun");
    expect(inv?.paid).toBe(false);
    expect(inv?.paymentTransactionId).toBeUndefined();
    expect(reopened.transactions).toHaveLength(state.transactions.length);
  });

  it("does nothing if invoice not paid", () => {
    const state = buildInitialState();
    const next = appReducer(state, { kind: "REOPEN_INVOICE", invoiceId: "inv-nu-jun" });
    expect(next).toEqual(state);
  });
});
