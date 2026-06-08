import { useState } from "react";
import { CardIcon, MoreIcon, PlusIcon } from "@/components/icons";
import type { CreditCard, Currency, Invoice } from "@/data/types";
import { formatDateLong, formatShortDate, getInvoiceStatus } from "@/lib/card-utils";
import { formatMoney } from "@/lib/format";

interface CardRowProps {
  card: CreditCard;
  currency: Currency;
  amountLabel: string;
  availLimit: number;
  invoice?: Invoice | null;
  isOverdue?: boolean;
  paymentDate?: string;
  onTap: () => void;
  ariaLabel: string;
  onAdd?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function CardRow({
  card,
  currency,
  amountLabel,
  availLimit,
  invoice,
  isOverdue,
  paymentDate,
  onTap,
  ariaLabel,
  onAdd,
  onEdit,
  onArchive,
  onDelete,
}: CardRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const inv = invoice;
  const closingDay = card.closingDay ?? 31;
  const dueDay = card.dueDay ?? 1;

  const dateLabel = (() => {
    if (!inv) return `Fecha em ${card.dateLabel}`;
    if (inv.paid && paymentDate) {
      return `Data do pagamento ${formatShortDate(paymentDate)}`;
    }
    if (isOverdue) {
      const dueM = (inv.month + 1) % 12;
      const dueY = inv.year + (inv.month === 11 ? 1 : 0);
      return `Venceu em ${formatDateLong(dueDay, dueM, dueY)}`;
    }
    const invStatus = getInvoiceStatus(inv, closingDay);
    if (invStatus === "open") {
      return `Fecha em ${formatDateLong(closingDay, inv.month, inv.year)}`;
    }
    // fatura fechada (não vencida, não paga) → data de vencimento
    const dueM = (inv.month + 1) % 12;
    const dueY = inv.year + (inv.month === 11 ? 1 : 0);
    return `Data do pagamento ${formatDateLong(dueDay, dueM, dueY)}`;
  })();

  const hasMenu = !!(onEdit || onArchive || onDelete);

  return (
    <li className="card-row">
      <button
        className="card-row__main"
        type="button"
        aria-label={ariaLabel}
        onClick={onTap}
      >
        <span className="card-row__icon">
          <CardIcon size={22} />
        </span>
        <span className="card-row__info">
          <span className="card-row__name">
            {card.name}
            {isOverdue && (
              <span className="card-row__overdue-badge">Fatura vencida</span>
            )}
          </span>
          <span className="card-row__date">{dateLabel}</span>
          <span className="card-row__limit">
            Limite disponível {formatMoney(availLimit, currency)}
          </span>
        </span>
        <span className="card-row__amount tnum">{amountLabel}</span>
      </button>

      {hasMenu ? (
        <div className="card-row__actions-end">
          <div className="card-row__more-wrap">
            <button
              type="button"
              className="card-row__more"
              aria-label="Opções do cartão"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
            >
              <MoreIcon size={18} />
            </button>

            {menuOpen && (
              <>
                <button
                  className="card-row__popover-backdrop"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  aria-label="Fechar"
                />
                <div className="card-row__popover">
                  {onEdit && (
                    <button
                      type="button"
                      className="card-menu__item"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                    >
                      Editar cartão
                    </button>
                  )}
                  {onArchive && (
                    <button
                      type="button"
                      className="card-menu__item"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive();
                      }}
                    >
                      Arquivar cartão
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="card-menu__item card-menu__item--danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                    >
                      Excluir cartão
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          {onAdd && (
            <div className="card-row__action">
              <button
                type="button"
                className="card-action card-action--add"
                aria-label="Adicionar despesa no cartão"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
              >
                <PlusIcon size={18} />
              </button>
            </div>
          )}
        </div>
      ) : onAdd ? (
        <div className="card-row__action">
          <button
            type="button"
            className="card-action card-action--add"
            aria-label="Adicionar despesa no cartão"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <PlusIcon size={18} />
          </button>
        </div>
      ) : null}
    </li>
  );
}
