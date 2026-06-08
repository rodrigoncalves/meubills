import { useMemo, useState } from "react";
import { CardIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, TrashIcon } from "@/components/icons";
import { PickerSheet } from "@/components/PickerSheet";
import { resolveGroup } from "@/data/mock";
import { MONTHS_LONG } from "@/components/MonthPicker";
import { getInvoiceStatus, isInvoiceOverdue } from "@/lib/card-utils";
import type { Category, Transaction } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import {
  invoiceAmount,
  invoiceForMonth,
  invoiceTransactions,
} from "@/store/selectors";
import "./InvoiceDetailScreen.css";

interface Props {
  cardId: string;
  month: number;
  year: number;
  onBack: () => void;
  onAddCardExpense: (cardId: string) => void;
}

type SortCol = "date" | "description" | "category" | "amount";

const STATUS_LABELS: Record<string, string> = {
  open: "Fatura aberta",
  closed: "Fatura fechada",
  paid: "Fatura paga",
};

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatDateGroupHeader(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const wd = WEEKDAYS_SHORT[date.getDay()];
  return `${wd}., ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function navMonth(month: number, year: number, delta: number): { month: number; year: number } {
  const d = new Date(year, month + delta, 1);
  return { month: d.getMonth(), year: d.getFullYear() };
}

function installmentText(tx: Transaction): string {
  if (!tx.seriesId || !tx.installments || tx.installments <= 1) return "";
  const suffix = tx.id.replace(tx.seriesId + "-", "");
  const idx = Number.parseInt(suffix, 10);
  const n = Number.isNaN(idx) ? "" : `${idx}/`;
  return ` (${n}${tx.installments})`;
}

function groupByDate(txs: Transaction[]): { date: string; txs: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const existing = map.get(tx.date) ?? [];
    existing.push(tx);
    map.set(tx.date, existing);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, txs]) => ({ date, txs }));
}

function sortedTxs(
  txs: Transaction[],
  col: SortCol,
  dir: "asc" | "desc",
  categories: Category[],
): Transaction[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...txs].sort((a, b) => {
    switch (col) {
      case "date":
        return sign * (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      case "description":
        return sign * (a.description ?? "").localeCompare(b.description ?? "", "pt-BR");
      case "category": {
        const ca = categories.find((c) => c.id === a.categoryId)?.name ?? "";
        const cb = categories.find((c) => c.id === b.categoryId)?.name ?? "";
        return sign * ca.localeCompare(cb, "pt-BR");
      }
      case "amount":
        return sign * (a.amount - b.amount);
    }
  });
}

export function InvoiceDetailScreen({ cardId, month, year, onBack, onAddCardExpense: _onAddCardExpense }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const [currentCardId, setCurrentCardId] = useState(cardId);
  const [curMonth, setCurMonth] = useState(month);
  const [curYear, setCurYear] = useState(year);
  const [cardPickerOpen, setCardPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const card = state.cards.find((c) => c.id === currentCardId) ?? state.cards[0];
  const group = resolveGroup(card.groupId);
  const invoice = invoiceForMonth(state, currentCardId, curMonth, curYear);
  const rawTxs = invoice ? invoiceTransactions(state, invoice.id) : [];
  const liveAmount = invoice ? invoiceAmount(state, invoice.id) : 0;
  const statusLabel = invoice
    ? (() => {
        const status = getInvoiceStatus(invoice, card.closingDay ?? 31);
        if (status === "open" && isInvoiceOverdue(invoice, card.closingDay ?? 31, card.dueDay ?? 1)) {
          return "Fatura vencida";
        }
        return STATUS_LABELS[status] ?? "—";
      })()
    : "Sem fatura";

  const monthLabel = `${MONTHS_LONG[curMonth]}`;

  const filteredTxs = useMemo(() => {
    if (!search.trim()) return rawTxs;
    const q = search.toLowerCase();
    return rawTxs.filter((t) => t.description?.toLowerCase().includes(q));
  }, [rawTxs, search]);

  const handlePrev = () => {
    const { month: m, year: y } = navMonth(curMonth, curYear, -1);
    setCurMonth(m);
    setCurYear(y);
  };

  const handleNext = () => {
    const { month: m, year: y } = navMonth(curMonth, curYear, 1);
    setCurMonth(m);
    setCurYear(y);
  };

  const handleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "date" ? "desc" : "asc");
    }
  };

  const handleDelete = (id: string) => {
    dispatch({ kind: "DELETE_TRANSACTION", id });
  };

  const cardPickerOptions = state.cards.map((c) => ({ id: c.id, label: c.name }));

  const desktopSortedTxs = sortedTxs(filteredTxs, sortCol, sortDir, state.categories);
  const groups = groupByDate(filteredTxs);

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
    <div className="invoice-detail">
      {/* ── Main column ── */}
      <div className="invoice-detail__main">
        {/* Top bar */}
        <div className="invoice-detail__topbar">
          <button type="button" className="invoice-detail__back" aria-label="Voltar" onClick={onBack}>
            <ChevronLeftIcon size={20} />
          </button>
          <button
            type="button"
            className="invoice-detail__card-pill"
            aria-label="Selecionar cartão"
            onClick={() => setCardPickerOpen(true)}
          >
            <CardIcon size={16} />
            {card.name}
            <ChevronRightIcon size={14} />
          </button>
        </div>

        {/* Month nav */}
        <div className="invoice-detail__month-nav">
          <button type="button" className="invoice-detail__month-btn" aria-label="Mês anterior" onClick={handlePrev}>
            <ChevronLeftIcon size={20} />
          </button>
          <span className="invoice-detail__month-label">
            {monthLabel}<span>{curYear}</span>
          </span>
          <button type="button" className="invoice-detail__month-btn" aria-label="Próximo mês" onClick={handleNext}>
            <ChevronRightIcon size={20} />
          </button>
        </div>

        {/* Hero — mobile only */}
        <div className="invoice-detail__hero">
          <div className="invoice-detail__hero-name">{card.name}</div>
          <div className="invoice-detail__hero-grid">
            <div className="invoice-detail__hero-item">
              <span className="invoice-detail__hero-label">Data de fechamento</span>
              <span className="invoice-detail__hero-value">{card.closingLabel ?? card.dateLabel}</span>
            </div>
            <div className="invoice-detail__hero-item">
              <span className="invoice-detail__hero-label">Vencimento</span>
              <span className="invoice-detail__hero-value">{card.dueLabel ?? "—"}</span>
            </div>
            <div className="invoice-detail__hero-item">
              <span className="invoice-detail__hero-label">Situação da fatura</span>
              <span className="invoice-detail__hero-value">{statusLabel}</span>
            </div>
            <div className="invoice-detail__hero-item">
              <span className="invoice-detail__hero-label">Valor da fatura</span>
              <span className="invoice-detail__hero-value invoice-detail__hero-value--expense">
                {formatMoney(liveAmount, group.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="invoice-detail__search-wrap">
          <span className="invoice-detail__search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            className="invoice-detail__search"
            type="search"
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar transações"
          />
        </div>

        {/* Mobile: grouped by date */}
        <div className="invoice-detail__list-wrap mobile-tx-list">
          {filteredTxs.length === 0 ? (
            <p className="invoice-detail__empty">Nenhuma transação nesta fatura.</p>
          ) : (
            groups.map(({ date, txs }) => (
              <div key={date} className="invoice-detail__date-group">
                <div className="invoice-detail__date-header">{formatDateGroupHeader(date)}</div>
                {txs.map((tx) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    cardName={card.name}
                    categories={state.categories}
                    currency={group.currency}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Desktop: sortable table */}
        <div className="invoice-detail__table-wrap">
          {filteredTxs.length === 0 ? (
            <p className="invoice-detail__empty">Nenhuma transação nesta fatura.</p>
          ) : (
            <table className="invoice-detail__table">
              <thead>
                <tr>
                  <th style={{ cursor: "default" }}>Sit.</th>
                  <SortTh col="date" label="Data" />
                  <SortTh col="description" label="Descrição" />
                  <SortTh col="category" label="Categoria" />
                  <SortTh col="amount" label="Valor" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {desktopSortedTxs.map((tx) => {
                  const cat = state.categories.find((c) => c.id === tx.categoryId);
                  const [y, m, d] = tx.date.split("-");
                  const dateFormatted = `${d}/${m}/${y}`;
                  const desc = (tx.description ?? "—") + installmentText(tx);
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "var(--credit)",
                          }}
                        />
                      </td>
                      <td>{dateFormatted}</td>
                      <td>{desc}</td>
                      <td>
                        <div className="invoice-detail__table-cat">
                          <span
                            className="invoice-detail__table-cat-dot"
                            style={{ background: cat?.color ?? "var(--text-muted)" }}
                          />
                          {cat?.name ?? "—"}
                        </div>
                      </td>
                      <td>{formatMoney(tx.amount, group.currency)}</td>
                      <td>
                        <button
                          type="button"
                          className="invoice-detail__table-del"
                          aria-label="Excluir transação"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="invoice-detail__sidebar" aria-label="Resumo da fatura">
        <SummaryCard label="Valor da fatura" value={formatMoney(liveAmount, group.currency)} valueClass="invoice-detail__summary-value--expense" />
        <SummaryCard label="Status" value={statusLabel} />
        <SummaryCard label="Dia de fechamento" value={card.closingLabel ?? card.dateLabel} />
        <SummaryCard label="Data vencimento" value={card.dueLabel ?? "—"} />
      </aside>

      {/* Card picker sheet */}
      <PickerSheet
        open={cardPickerOpen}
        title="Selecionar cartão"
        options={cardPickerOptions}
        selectedId={currentCardId}
        onSelect={(id) => {
          setCurrentCardId(id);
        }}
        onClose={() => setCardPickerOpen(false)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="invoice-detail__summary-card">
      <div className="invoice-detail__summary-card-body">
        <span className="invoice-detail__summary-label">{label}</span>
        <span className={`invoice-detail__summary-value${valueClass ? ` ${valueClass}` : ""}`}>
          {value}
        </span>
      </div>
      <div className="invoice-detail__summary-icon">
        <CardIcon size={20} />
      </div>
    </div>
  );
}

function TxRow({
  tx,
  cardName,
  categories,
  currency,
  onDelete,
}: {
  tx: Transaction;
  cardName: string;
  categories: Category[];
  currency: string;
  onDelete: (id: string) => void;
}) {
  const cat = categories.find((c) => c.id === tx.categoryId);
  const desc = (tx.description ?? "—") + installmentText(tx);

  return (
    <div className="tx-row">
      <div
        className="tx-row__icon"
        style={{ background: cat?.color ?? "var(--text-muted)" }}
        aria-hidden="true"
      >
        <TagIcon size={18} />
      </div>
      <div className="tx-row__body">
        <div className="tx-row__desc">{desc}</div>
        <div className="tx-row__sub">
          {cat?.name ?? "—"} | {cardName}
        </div>
      </div>
      <div className="tx-row__right">
        <span className="tx-row__amount">{formatMoney(tx.amount, currency as any)}</span>
        <button
          type="button"
          className="tx-row__delete"
          aria-label="Excluir transação"
          onClick={() => onDelete(tx.id)}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}
