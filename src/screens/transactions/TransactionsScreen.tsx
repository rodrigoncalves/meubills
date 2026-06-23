import { useMemo, useRef, useState } from "react";
import { CheckIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { resolveGroup } from "@/data/mock";
import type { Transaction, TransactionFilter } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import { groupTransactions } from "@/store/selectors";
import type { AppState } from "@/store/types";
import { FILTER_LABELS, TypeFilterMenu } from "./TypeFilterMenu";
import "./TransactionsScreen.css";

interface Props {
  groupId: string;
  month: number;
  year: number;
  monthLabel: string;
  accountId?: string;
  onClearAccountFilter?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

type SortCol = "date" | "description" | "category" | "account" | "amount";

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

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

function categoryOf(t: Transaction, state: AppState) {
  return state.categories.find((c) => c.id === t.categoryId);
}

function descriptionLabel(t: Transaction, state: AppState): string {
  return t.description || categoryOf(t, state)?.name || (t.type === "transferencia" ? "Transferência" : "Lançamento");
}

function accountLabel(t: Transaction, state: AppState): string {
  if (t.type === "transferencia") {
    const from = state.accounts.find((a) => a.id === t.fromAccountId)?.name ?? "—";
    const to = state.accounts.find((a) => a.id === t.toAccountId)?.name ?? "—";
    return `${from} → ${to}`;
  }
  if (t.type === "despesa-cartao") {
    return state.cards.find((c) => c.id === t.cardId)?.name ?? "—";
  }
  return state.accounts.find((a) => a.id === t.accountId)?.name ?? "—";
}

function statusOf(t: Transaction): { label: string; tone: "paid" | "pending" | "neutral" } {
  if (t.type === "transferencia") return { label: "—", tone: "neutral" };
  if (t.settled) return { label: t.type === "receita" ? "Recebido" : "Pago", tone: "paid" };
  return { label: "Pendente", tone: "pending" };
}

function canPay(t: Transaction): boolean {
  return !t.settled && (t.type === "despesa" || t.type === "receita");
}

function sortRows(rows: Transaction[], col: SortCol, dir: "asc" | "desc", state: AppState): Transaction[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (col) {
      case "date":
        return sign * (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      case "description":
        return sign * descriptionLabel(a, state).localeCompare(descriptionLabel(b, state), "pt-BR");
      case "category": {
        const ca = categoryOf(a, state)?.name ?? "";
        const cb = categoryOf(b, state)?.name ?? "";
        return sign * ca.localeCompare(cb, "pt-BR");
      }
      case "account":
        return sign * accountLabel(a, state).localeCompare(accountLabel(b, state), "pt-BR");
      case "amount":
        return sign * (a.amount - b.amount);
    }
  });
}

export function TransactionsScreen({
  groupId,
  month,
  year,
  monthLabel,
  accountId,
  onClearAccountFilter,
  onEditTransaction,
}: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const currency = resolveGroup(groupId).currency;
  const rows = useMemo(() => {
    const all = groupTransactions(state, groupId, month, year, filter);
    if (!accountId) return all;
    return all.filter((t) => t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId);
  }, [state, groupId, month, year, filter, accountId]);

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

  // group by day (mobile list)
  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of rows) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()];
  }, [rows]);

  // sorted flat list (desktop table)
  const sortedRows = useMemo(() => sortRows(rows, sortCol, sortDir, state), [rows, sortCol, sortDir, state]);

  const amountText = (t: Transaction) =>
    t.type === "transferencia" ? formatMoney(t.amount, currency) : formatMoney(signed(t), currency);

  const handleDelete = (id: string) => {
    dispatch({ kind: "DELETE_TRANSACTION", id });
    setOpenRowId(null);
  };

  const handlePay = (t: Transaction) => {
    dispatch({
      kind: "UPDATE_TRANSACTION",
      id: t.id,
      scope: "one",
      update: {
        amount: t.amount,
        date: t.date,
        description: t.description,
        categoryId: t.categoryId,
        accountId: t.accountId,
        fromAccountId: t.fromAccountId,
        toAccountId: t.toAccountId,
        settled: true,
        ignored: t.ignored,
      },
    });
    setOpenRowId(null);
  };

  const handleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "date" ? "desc" : "asc");
    }
  };

  function SortTh({ col, label }: { col: SortCol; label: string }) {
    const active = sortCol === col;
    const arrow = active ? (sortDir === "asc" ? " ↑" : " ↓") : "";
    return (
      <th className={active ? "is-sorted" : ""} onClick={() => handleSort(col)}>
        {label}
        <span className="sort-arrow">{arrow}</span>
      </th>
    );
  }

  return (
    <div className="txlist">
      <header className="txlist__header">
        <button type="button" className="txlist__filter" onClick={() => setMenuOpen(true)}>
          {FILTER_LABELS[filter]} ▾
        </button>
        <div className="txlist__month">{monthLabel}</div>
      </header>
      {accountId && (
        <div className="txlist__account-chip">
          <span>{state.accounts.find((a) => a.id === accountId)?.name ?? "Conta"}</span>
          <button
            type="button"
            className="txlist__chip-clear"
            onClick={onClearAccountFilter}
            aria-label="Remover filtro"
          >
            x
          </button>
        </div>
      )}

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

      {byDay.length === 0 ? (
        <p className="txlist__empty">Nenhuma transação neste mês.</p>
      ) : (
        <>
          {/* Mobile: day-grouped, swipeable rows */}
          <div className="txlist__mobile">
            {byDay.map(([day, items]) => (
              <section key={day} className="txlist__day">
                <h3 className="txlist__day-head">{dayHeading(day)}</h3>
                <ul className="txlist__items">
                  {items.map((t) => (
                    <SwipeRow
                      key={t.id}
                      tx={t}
                      state={state}
                      amountText={amountText(t)}
                      open={openRowId === t.id}
                      onOpen={() => setOpenRowId(t.id)}
                      onClose={() => setOpenRowId(null)}
                      onEdit={onEditTransaction ? () => onEditTransaction(t) : undefined}
                      onPay={() => handlePay(t)}
                      onDelete={() => handleDelete(t.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Desktop: sortable table */}
          <div className="txlist__table-wrap">
            <table className="txlist__table">
              <thead>
                <tr>
                  <th className="txlist__th-plain">Situação</th>
                  <SortTh col="date" label="Data" />
                  <SortTh col="description" label="Descrição" />
                  <SortTh col="category" label="Categoria" />
                  <SortTh col="account" label="Conta" />
                  <SortTh col="amount" label="Valor" />
                  <th className="txlist__th-plain">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((t) => {
                  const cat = categoryOf(t, state);
                  const st = statusOf(t);
                  const [y, m, d] = t.date.split("-");
                  return (
                    <tr
                      key={t.id}
                      className="txlist__row"
                      onClick={onEditTransaction ? () => onEditTransaction(t) : undefined}
                    >
                      <td>
                        <span className={`txlist__status txlist__status--${st.tone}`}>
                          <span className="txlist__status-dot" />
                          {st.label}
                        </span>
                      </td>
                      <td>{`${d}/${m}/${y}`}</td>
                      <td>{descriptionLabel(t, state)}</td>
                      <td>
                        {t.type === "transferencia" ? (
                          "—"
                        ) : (
                          <span className="txlist__cat">
                            <span
                              className="txlist__cat-dot"
                              style={{ background: cat?.color ?? "var(--text-muted)" }}
                            />
                            {cat?.name ?? "—"}
                          </span>
                        )}
                      </td>
                      <td>{accountLabel(t, state)}</td>
                      <td className={`txlist__amount txlist__amount--${t.type}`}>{amountText(t)}</td>
                      <td>
                        <div className="txlist__acts">
                          {canPay(t) && (
                            <button
                              type="button"
                              className="txlist__act txlist__act--pay"
                              aria-label="Pagar"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePay(t);
                              }}
                            >
                              <CheckIcon size={16} />
                            </button>
                          )}
                          {onEditTransaction && (
                            <button
                              type="button"
                              className="txlist__act txlist__act--edit"
                              aria-label="Editar"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTransaction(t);
                              }}
                            >
                              <PencilIcon size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="txlist__act txlist__act--del"
                            aria-label="Excluir"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(t.id);
                            }}
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <TypeFilterMenu open={menuOpen} value={filter} onSelect={setFilter} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

function SwipeRow({
  tx,
  state,
  amountText,
  open,
  onOpen,
  onClose,
  onEdit,
  onPay,
  onDelete,
}: {
  tx: Transaction;
  state: AppState;
  amountText: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onEdit?: () => void;
  onPay: () => void;
  onDelete: () => void;
}) {
  const payable = canPay(tx);
  const revealWidth = payable ? 144 : 72;

  const [dragX, setDragX] = useState<number | null>(null);
  const startX = useRef(0);
  const baseX = useRef(0);
  const moved = useRef(false);

  const dragging = dragX !== null;
  const x = dragging ? dragX : open ? -revealWidth : 0;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    baseX.current = open ? -revealWidth : 0;
    moved.current = false;
    setDragX(baseX.current);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - startX.current;
    if (Math.abs(delta) > 6) moved.current = true;
    const next = Math.max(-revealWidth, Math.min(0, baseX.current + delta));
    setDragX(next);
  };

  const onTouchEnd = () => {
    const dropped = dragX ?? 0;
    setDragX(null);
    if (!moved.current) {
      // tap: edit when closed, dismiss when open
      if (open) onClose();
      else onEdit?.();
      return;
    }
    if (dropped <= -revealWidth * 0.4) onOpen();
    else onClose();
  };

  return (
    <li className="txlist__swipe">
      <div className="txlist__swipe-actions" aria-hidden={!open}>
        {payable && (
          <button type="button" className="txlist__swipe-btn txlist__swipe-btn--pay" aria-label="Pagar" onClick={onPay}>
            <CheckIcon size={18} />
          </button>
        )}
        <button
          type="button"
          className="txlist__swipe-btn txlist__swipe-btn--del"
          aria-label="Excluir"
          onClick={onDelete}
        >
          <TrashIcon size={18} />
        </button>
      </div>
      <div
        className="txlist__swipe-fg"
        style={{ transform: `translateX(${x}px)`, transition: dragging ? "none" : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role={onEdit ? "button" : undefined}
        tabIndex={onEdit ? 0 : undefined}
        onKeyDown={
          onEdit
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onEdit();
                }
              }
            : undefined
        }
      >
        <div className="txlist__item">
          <div className="txlist__item-main">
            <span className="txlist__item-title">{descriptionLabel(tx, state)}</span>
            <span className="txlist__item-sub">
              {tx.type === "transferencia" ? accountLabel(tx, state) : categoryOf(tx, state)?.name}
            </span>
          </div>
          <span className={`txlist__amount txlist__amount--${tx.type}`}>{amountText}</span>
        </div>
      </div>
    </li>
  );
}
