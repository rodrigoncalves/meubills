import { CardRow } from "@/components/CardRow";
import type { CreditCard, Currency, Invoice } from "@/data/types";
import { getInvoiceStatus, isInvoiceOverdue } from "@/lib/card-utils";
import { maskMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { cardAvailableLimit, cardInvoices, cardsByGroup, invoiceAmount } from "@/store/selectors";
import { useMemo, useState } from "react";
import "./CardsSection.css";

interface Props {
  cards: CreditCard[];
  currency: Currency;
  visible: boolean;
  groupId?: string;
  onOpenCards?: () => void;
  onCardTap?: (cardId: string, month: number, year: number) => void;
}

type Tab = "open" | "closed";

export function CardsSection({ cards, currency, visible, groupId, onOpenCards, onCardTap }: Props) {
  const state = useAppState();
  const [tab, setTab] = useState<Tab>("open");

  // Use store cards when groupId is available, otherwise fall back to prop
  const allCards = useMemo(() => (groupId ? cardsByGroup(state, groupId) : cards), [state, groupId, cards]);

  // Per-card open / latest-closed invoice lookup
  const cardInvData = useMemo(() => {
    const map: Record<string, { open: Invoice | null; closed: Invoice | null }> = {};
    for (const card of allCards) {
      const closingDay = card.closingDay ?? 31;
      const invoices = cardInvoices(state, card.id);

      const openInv = invoices.find((inv) => getInvoiceStatus(inv, closingDay) === "open") ?? null;

      // Closed = month immediately before the open invoice
      const closedInv = (() => {
        if (!openInv) return null;
        const closedMonth = openInv.month === 0 ? 11 : openInv.month - 1;
        const closedYear = openInv.month === 0 ? openInv.year - 1 : openInv.year;
        return invoices.find((inv) => inv.month === closedMonth && inv.year === closedYear && !inv.paid) ?? null;
      })();

      map[card.id] = { open: openInv, closed: closedInv };
    }
    return map;
  }, [state, allCards]);

  // Only cards that have a relevant invoice for the active tab
  const visibleCards = useMemo(
    () =>
      allCards.filter((card) => {
        const data = cardInvData[card.id];
        return tab === "open" ? data?.open != null : data?.closed != null;
      }),
    [allCards, cardInvData, tab],
  );

  // Per-card amounts based on the selected tab invoice
  const cardAmounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const card of visibleCards) {
      const inv = tab === "open" ? cardInvData[card.id]?.open : cardInvData[card.id]?.closed;
      map[card.id] = inv ? invoiceAmount(state, inv.id) : 0;
    }
    return map;
  }, [state, visibleCards, cardInvData, tab]);

  // Available limits — always based on all unpaid
  const availLimits = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of allCards) map[c.id] = cardAvailableLimit(state, c.id);
    return map;
  }, [state, allCards]);

  const total = visibleCards.reduce((sum, c) => sum + (cardAmounts[c.id] ?? 0), 0);

  return (
    <section className="cards">
      <div className="cards__title-row">
        {onOpenCards ? (
          <button
            type="button"
            className="cards__title-btn section-title"
            onClick={onOpenCards}
            aria-label="Ver cartões de crédito"
          >
            <span className="section-title">Cartões de crédito</span>
          </button>
        ) : (
          <h2 className="section-title">Cartões de crédito</h2>
        )}
      </div>

      <div className="cards__panel">
        <div className="seg" role="tablist" aria-label="Filtro de faturas">
          <button
            role="tab"
            aria-selected={tab === "open"}
            className={`seg__btn${tab === "open" ? " is-active" : ""}`}
            onClick={() => setTab("open")}
          >
            Faturas abertas
          </button>
          <button
            role="tab"
            aria-selected={tab === "closed"}
            className={`seg__btn${tab === "closed" ? " is-active" : ""}`}
            onClick={() => setTab("closed")}
          >
            Faturas fechadas
          </button>
        </div>

        {visibleCards.length === 0 ? (
          <p className="cards__empty">Nenhuma fatura {tab === "open" ? "aberta" : "fechada"} no momento.</p>
        ) : (
          <ul className="cards__list">
            {visibleCards.map((card) => {
              const inv = tab === "open" ? cardInvData[card.id]?.open : cardInvData[card.id]?.closed;
              const closingDay = card.closingDay ?? 31;
              const dueDay = card.dueDay ?? 1;
              const overdue = inv != null && !inv.paid ? isInvoiceOverdue(inv, closingDay, dueDay) : false;
              const paymentTx =
                inv?.paid && inv.paymentTransactionId
                  ? state.transactions.find((t) => t.id === inv.paymentTransactionId)
                  : null;

              return (
                <CardRow
                  key={card.id}
                  card={card}
                  currency={currency}
                  amountLabel={maskMoney(visible, cardAmounts[card.id] ?? 0, currency)}
                  availLimit={availLimits[card.id] ?? card.totalLimit}
                  invoice={inv}
                  isOverdue={overdue}
                  paymentDate={paymentTx?.date}
                  onTap={() =>
                    onCardTap
                      ? onCardTap(card.id, inv?.month ?? new Date().getMonth(), inv?.year ?? new Date().getFullYear())
                      : onOpenCards?.()
                  }
                  ariaLabel={`Abrir fatura ${card.name}`}
                />
              );
            })}
          </ul>
        )}

        <div className="cards__total">
          <span>TOTAL</span>
          <span className="tnum">{maskMoney(visible, total, currency)}</span>
        </div>
      </div>
    </section>
  );
}
