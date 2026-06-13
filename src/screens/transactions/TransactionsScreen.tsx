import { useMemo, useState } from "react";
import { resolveGroup } from "@/data/mock";
import type { Transaction, TransactionFilter } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { groupTransactions } from "@/store/selectors";
import { FILTER_LABELS, TypeFilterMenu } from "./TypeFilterMenu";
import "./TransactionsScreen.css";

interface Props {
  groupId: string;
  month: number;
  year: number;
  monthLabel: string;
  onEditTransaction?: (tx: Transaction) => void;
}

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

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

export function TransactionsScreen({ groupId, month, year, monthLabel, onEditTransaction }: Props) {
  const state = useAppState();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const currency = resolveGroup(groupId).currency;
  const rows = useMemo(
    () => groupTransactions(state, groupId, month, year, filter),
    [state, groupId, month, year, filter],
  );

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

  // group by day
  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of rows) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <div className="txlist">
      <header className="txlist__header">
        <button type="button" className="txlist__filter" onClick={() => setMenuOpen(true)}>
          {FILTER_LABELS[filter]} ▾
        </button>
        <div className="txlist__month">{monthLabel}</div>
      </header>

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

      {byDay.length === 0 && <p className="txlist__empty">Nenhuma transação neste mês.</p>}

      {byDay.map(([day, items]) => (
        <section key={day} className="txlist__day">
          <h3 className="txlist__day-head">{dayHeading(day)}</h3>
          <ul className="txlist__items">
            {items.map((t) => (
              <li
                key={t.id}
                className={`txlist__item${onEditTransaction ? " txlist__item--tappable" : ""}`}
                role={onEditTransaction ? "button" : undefined}
                tabIndex={onEditTransaction ? 0 : undefined}
                onClick={onEditTransaction ? () => onEditTransaction(t) : undefined}
                onKeyDown={
                  onEditTransaction
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEditTransaction(t);
                        }
                      }
                    : undefined
                }
              >
                <div className="txlist__item-main">
                  <span className="txlist__item-title">
                    {t.description ||
                      state.categories.find((c) => c.id === t.categoryId)?.name ||
                      (t.type === "transferencia" ? "Transferência" : "Lançamento")}
                  </span>
                  <span className="txlist__item-sub">
                    {t.type === "transferencia"
                      ? `${state.accounts.find((a) => a.id === t.fromAccountId)?.name} → ${state.accounts.find((a) => a.id === t.toAccountId)?.name}`
                      : state.categories.find((c) => c.id === t.categoryId)?.name}
                  </span>
                </div>
                <span className={`txlist__amount txlist__amount--${t.type}`}>
                  {t.type === "transferencia"
                    ? formatMoney(t.amount, currency)
                    : formatMoney(signed(t), currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <TypeFilterMenu
        open={menuOpen}
        value={filter}
        onSelect={setFilter}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}
