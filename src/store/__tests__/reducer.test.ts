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
