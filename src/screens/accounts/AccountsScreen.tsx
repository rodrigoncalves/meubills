import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreIcon, PlusIcon, TrendUpIcon } from "@/components/icons";
import { resolveGroup } from "@/data/mock";
import type { Account } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import { accountBalance, accountPredictedBalance, homeBalance, homePredictedBalance } from "@/store/selectors";
import { AccountForm } from "./AccountForm";
import { AccountRow } from "./AccountRow";
import { BalanceAdjustSheet } from "./BalanceAdjustSheet";
import "./AccountsScreen.css";

const MONTHS_SHORT_PT = [
  "jan.",
  "fev.",
  "mar.",
  "abr.",
  "mai.",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "out.",
  "nov.",
  "dez.",
];

function lastDayNum(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function prevMonth(month: number, year: number): { month: number; year: number } {
  return month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
}

function nextMonth(month: number, year: number): { month: number; year: number } {
  return month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };
}

interface Props {
  groupId: string;
  month: number;
  year: number;
  monthLabel: string;
  onOpenMonthPicker: () => void;
  onSelectMonth: (month: number, year: number) => void;
  onViewAccountTransactions: (accountId: string) => void;
}

export function AccountsScreen({
  groupId,
  month,
  year,
  monthLabel,
  onOpenMonthPicker,
  onSelectMonth,
  onViewAccountTransactions,
}: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const [editAccount, setEditAccount] = useState<Account | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const group = resolveGroup(groupId);
  const currency = group.currency;

  const accounts = useMemo(
    () => state.accounts.filter((a) => a.groupId === groupId && !a.archived),
    [state.accounts, groupId],
  );

  const currentTotal = useMemo(() => homeBalance(state, groupId), [state, groupId]);
  const predictedTotal = useMemo(
    () => homePredictedBalance(state, groupId, month, year),
    [state, groupId, month, year],
  );

  const predictedLabel = `${lastDayNum(month, year)} de ${MONTHS_SHORT_PT[month]}`;

  const openCreate = () => {
    setEditAccount(undefined);
    setFormOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditAccount(a);
    setFormOpen(true);
  };

  const archiveAccount = (id: string) => {
    dispatch({ kind: "UPDATE_ACCOUNT", accountId: id, update: { archived: true } });
  };

  const prev = prevMonth(month, year);
  const next = nextMonth(month, year);

  return (
    <div className="accounts">
      {/* Mobile header */}
      <header className="accounts__header accounts__header--mobile">
        <span className="accounts__header-spacer" />
        <h1 className="accounts__title">Contas</h1>
        <div className="accounts__hdr-actions">
          <div className="accounts__menu-wrap">
            <button
              type="button"
              className="accounts__icon-btn"
              aria-label="Mais opções"
              onClick={() => setHeaderMenuOpen((o) => !o)}
            >
              <MoreIcon size={22} />
            </button>
            {headerMenuOpen && (
              <>
                <button
                  className="account-row__backdrop"
                  onClick={() => setHeaderMenuOpen(false)}
                  aria-label="Fechar"
                />
                <div className="account-row__popover accounts__hdr-popover">
                  <button
                    type="button"
                    className="card-menu__item"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      openCreate();
                    }}
                  >
                    Cadastrar conta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Desktop header */}
      <header className="accounts__header accounts__header--desktop">
        <h1 className="accounts__title">Contas</h1>
        <div className="accounts__hdr-actions">
          <button type="button" className="accounts__icon-btn" aria-label="Nova conta" onClick={openCreate}>
            <PlusIcon size={20} />
          </button>
          <button type="button" className="accounts__icon-btn" aria-label="Gráfico">
            <TrendUpIcon size={20} />
          </button>
          <button type="button" className="accounts__icon-btn" aria-label="Mais opções">
            <MoreIcon size={20} />
          </button>
        </div>
      </header>

      {/* Month strip */}
      <div className="accounts__month-strip">
        <button
          type="button"
          className="accounts__month-nav"
          aria-label="Mês anterior"
          onClick={() => onSelectMonth(prev.month, prev.year)}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <button type="button" className="accounts__month-label" onClick={onOpenMonthPicker} aria-label="Selecionar mês">
          {monthLabel}
        </button>
        <button
          type="button"
          className="accounts__month-nav"
          aria-label="Próximo mês"
          onClick={() => onSelectMonth(next.month, next.year)}
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Summary */}
      <div className="accounts__summary">
        <div className="accounts__summary-card">
          <span className="accounts__summary-label">Saldo atual</span>
          <span className="accounts__summary-value tnum">{formatMoney(currentTotal, currency)}</span>
        </div>
        <div className="accounts__summary-divider" />
        <div className="accounts__summary-card">
          <span className="accounts__summary-label">Total até {predictedLabel}</span>
          <span className="accounts__summary-value accounts__summary-value--predicted tnum">
            {formatMoney(predictedTotal, currency)}
          </span>
        </div>
      </div>

      {/* Account list */}
      <ul className="accounts__list">
        {accounts.map((a) => (
          <li key={a.id} className="accounts__item">
            <AccountRow
              account={a}
              currency={currency}
              currentBalance={accountBalance(state, a.id)}
              predictedBalance={accountPredictedBalance(state, a.id, month, year)}
              predictedLabel={predictedLabel}
              onEdit={() => openEdit(a)}
              onArchive={() => archiveAccount(a.id)}
              onViewTransactions={() => onViewAccountTransactions(a.id)}
              onAdjust={() => setAdjustId(a.id)}
            />
          </li>
        ))}
      </ul>

      {/* Mobile add button */}
      <div className="accounts__add-wrap">
        <button type="button" className="accounts__add-btn" onClick={openCreate}>
          Cadastrar conta
        </button>
      </div>

      {/* Sheets */}
      <AccountForm
        key={editAccount?.id ?? "new"}
        account={editAccount}
        open={formOpen}
        groupId={groupId}
        onClose={() => {
          setFormOpen(false);
          setEditAccount(undefined);
        }}
      />
      <BalanceAdjustSheet accountId={adjustId} onClose={() => setAdjustId(null)} />
    </div>
  );
}
