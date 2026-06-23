import { useState } from "react";
import { BankIcon, MoreIcon } from "@/components/icons";
import type { Account, Currency } from "@/data/types";
import { formatMoney } from "@/lib/format";

interface Props {
  account: Account;
  currency: Currency;
  currentBalance: number;
  predictedBalance: number;
  predictedLabel: string;
  onEdit: () => void;
  onArchive: () => void;
  onViewTransactions: () => void;
  onAdjust: () => void;
}

export function AccountRow({
  account,
  currency,
  currentBalance,
  predictedBalance,
  predictedLabel,
  onEdit,
  onArchive,
  onViewTransactions,
  onAdjust,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <div className="account-row">
      <div className="account-row__main">
        <span className="account-row__icon">
          <BankIcon size={20} />
        </span>
        <span className="account-row__name">{account.name}</span>
        <div className="account-row__more-wrap">
          <button
            type="button"
            className="account-row__more"
            aria-label="Opções da conta"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            <MoreIcon size={18} />
          </button>
          {menuOpen && (
            <>
              <button className="account-row__backdrop" onClick={close} aria-label="Fechar" />
              <div className="account-row__popover">
                <button
                  type="button"
                  className="card-menu__item"
                  onClick={() => {
                    close();
                    onEdit();
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="card-menu__item"
                  onClick={() => {
                    close();
                    onViewTransactions();
                  }}
                >
                  Transações
                </button>
                <button
                  type="button"
                  className="card-menu__item"
                  onClick={() => {
                    close();
                    onAdjust();
                  }}
                >
                  Reajustar saldo
                </button>
                <button
                  type="button"
                  className="card-menu__item card-menu__item--danger"
                  onClick={() => {
                    close();
                    onArchive();
                  }}
                >
                  Arquivar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="account-row__balances">
        <div className="account-row__bal-row">
          <span className="account-row__bal-label">Saldo atual</span>
          <span className="account-row__bal-value account-row__bal-value--income tnum">
            {formatMoney(currentBalance, currency)}
          </span>
        </div>
        <div className="account-row__bal-row">
          <span className="account-row__bal-label">Saldo previsto ({predictedLabel})</span>
          <span className="account-row__bal-value tnum">{formatMoney(predictedBalance, currency)}</span>
        </div>
      </div>
    </div>
  );
}
