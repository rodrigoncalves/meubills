import { useMemo, useState } from "react";
import { CardIcon, ChevronLeftIcon, PlusIcon, ReceiptIcon } from "@/components/icons";
import { CardRow } from "@/components/CardRow";
import { useToast } from "@/components/Toast";
import { resolveGroup } from "@/data/mock";
import type { CreditCard, Currency, Invoice, Transaction } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { getInvoiceStatus, isInvoiceOverdue } from "@/lib/card-utils";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import {
  cardAvailableLimit,
  cardInvoices,
  cardsByGroup,
  invoiceAmount,
} from "@/store/selectors";
import { CardForm } from "./CardForm";
import { InvoiceDetailScreen } from "./InvoiceDetailScreen";
import "./CardsScreen.css";

interface Props {
  activeGroupId: string;
  onAddCardExpense: (cardId: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  initialDetail?: { cardId: string; month: number; year: number };
}

type DetailView = { cardId: string; month: number; year: number };

export function CardsScreen({ activeGroupId, onAddCardExpense, onEditTransaction, initialDetail }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [groupId, setGroupId] = useState(activeGroupId);
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [detail, setDetail] = useState<DetailView | null>(initialDetail ?? null);

  // Card CRUD state
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [editCardId, setEditCardId] = useState<string | undefined>(undefined);

  // Archived view
  const [showArchived, setShowArchived] = useState(false);

  const today = new Date();
  const group = resolveGroup(groupId);

  const allCards = useMemo(() => cardsByGroup(state, groupId), [state, groupId]);

  // Per-card open / latest-closed invoice lookup
  const cardInvData = useMemo(() => {
    const map: Record<string, { open: Invoice | null; closed: Invoice | null }> = {};
    for (const card of allCards) {
      const closingDay = card.closingDay ?? 31;
      const invoices = cardInvoices(state, card.id);

      const openInv =
        invoices.find((inv) => getInvoiceStatus(inv, closingDay) === "open") ?? null;

      // Closed = month immediately before the open invoice
      const closedInv = (() => {
        if (!openInv) return null;
        const closedMonth = openInv.month === 0 ? 11 : openInv.month - 1;
        const closedYear = openInv.month === 0 ? openInv.year - 1 : openInv.year;
        return (
          invoices.find(
            (inv) => inv.month === closedMonth && inv.year === closedYear && !inv.paid,
          ) ?? null
        );
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
      const inv =
        tab === "open" ? cardInvData[card.id]?.open : cardInvData[card.id]?.closed;
      map[card.id] = inv ? invoiceAmount(state, inv.id) : 0;
    }
    return map;
  }, [state, visibleCards, cardInvData, tab]);

  const availLimits = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of allCards) map[c.id] = cardAvailableLimit(state, c.id);
    return map;
  }, [state, allCards]);

  const total = visibleCards.reduce((sum, c) => sum + (cardAmounts[c.id] ?? 0), 0);

  const totalAvailLimit = useMemo(
    () => allCards.reduce((sum, c) => sum + (availLimits[c.id] ?? 0), 0),
    [allCards, availLimits],
  );

  const handleCardTap = (cardId: string) => {
    const data = cardInvData[cardId];
    const inv = tab === "open" ? data?.open : data?.closed;
    setDetail({
      cardId,
      month: inv?.month ?? today.getMonth(),
      year: inv?.year ?? today.getFullYear(),
    });
  };

  const handleCreateCard = () => {
    setEditCardId(undefined);
    setCardFormOpen(true);
  };

  // ── Archived view ──
  if (showArchived) {
    const archivedCards = allCards.filter((c) => c.archived);

    return (
      <div className="cards-screen">
        <div className="cards-screen__header">
          <div className="cards-screen__header-row">
            <button
              type="button"
              className="cards-screen__back"
              aria-label="Voltar"
              onClick={() => setShowArchived(false)}
            >
              <ChevronLeftIcon size={20} />
            </button>
            <h1 className="cards-screen__title">Cartões arquivados</h1>
          </div>
        </div>

        {archivedCards.length === 0 ? (
          <p className="cards-screen__empty">Nenhum cartão arquivado.</p>
        ) : (
          <ul className="cards-screen__list">
            {archivedCards.map((card) => (
              <ArchivedCardRow
                key={card.id}
                card={card}
                currency={group.currency}
                onRestore={() => {
                  dispatch({
                    kind: "UPDATE_CREDIT_CARD",
                    cardId: card.id,
                    update: { archived: false },
                  } as any);
                  toast.show("Cartão restaurado");
                }}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ── Invoice detail view ──
  if (detail) {
    return (
      <InvoiceDetailScreen
        cardId={detail.cardId}
        month={detail.month}
        year={detail.year}
        onBack={() => setDetail(null)}
        onAddCardExpense={onAddCardExpense}
        onEditTransaction={onEditTransaction}
      />
    );
  }

  // ── Main card list ──
  return (
    <div className="cards-screen">
      <div className="cards-screen__header">
        <h1 className="cards-screen__title">Cartões de crédito</h1>

        <div className="group-filter" role="group" aria-label="Filtrar por grupo">
          {state.groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`group-chip${g.id === groupId ? " is-active" : ""}`}
              style={{ "--accent": g.accent } as React.CSSProperties}
              onClick={() => setGroupId(g.id)}
            >
              {g.short}
            </button>
          ))}
        </div>

        <div className="cards-screen__header-actions">
          <button
            type="button"
            className="cards-screen__create"
            onClick={handleCreateCard}
          >
            <PlusIcon size={16} />
            Novo cartão
          </button>
          <button
            type="button"
            className="cards-screen__show-archived"
            onClick={() => setShowArchived(true)}
          >
            Ver arquivados
          </button>
        </div>
      </div>

      <div className="cards-screen__body">
      <div className="cards-screen__summaries">
        <div className="cards-screen__summary-box">
          <div className="cards-screen__summary-text">
            <span className="cards-screen__summary-label">Limite Disponível</span>
            <span className="cards-screen__summary-value">{formatMoney(totalAvailLimit, group.currency)}</span>
          </div>
          <span className="cards-screen__summary-icon">
            <CardIcon size={22} />
          </span>
        </div>
        <div className="cards-screen__summary-box">
          <div className="cards-screen__summary-text">
            <span className="cards-screen__summary-label">Valor total</span>
            <span className="cards-screen__summary-value">{formatMoney(total, group.currency)}</span>
          </div>
          <span className="cards-screen__summary-icon">
            <ReceiptIcon size={22} />
          </span>
        </div>
      </div>

      <div className="cards-screen__panel">
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

        {allCards.length === 0 ? (
          <p className="cards-screen__empty">Nenhum cartão neste grupo.</p>
        ) : visibleCards.length === 0 ? (
          <p className="cards-screen__empty">
            Nenhuma fatura {tab === "open" ? "aberta" : "fechada"} no momento.
          </p>
        ) : (
          <ul className="cards-screen__list">
            {visibleCards.map((card) => {
              const inv =
                tab === "open"
                  ? cardInvData[card.id]?.open
                  : cardInvData[card.id]?.closed;
              const closingDay = card.closingDay ?? 31;
              const dueDay = card.dueDay ?? 1;
              const overdue = inv != null && !inv.paid
                ? isInvoiceOverdue(inv, closingDay, dueDay)
                : false;
              const paymentTx = inv?.paid && inv.paymentTransactionId
                ? state.transactions.find((t) => t.id === inv.paymentTransactionId)
                : null;
              return (
                <CardRow
                  key={card.id}
                  card={card}
                  currency={group.currency}
                  amountLabel={formatMoney(cardAmounts[card.id], group.currency)}
                  availLimit={availLimits[card.id]}
                  invoice={inv}
                  isOverdue={overdue}
                  paymentDate={paymentTx?.date}
                  onTap={() => handleCardTap(card.id)}
                  ariaLabel={`Ver fatura ${card.name}`}
                  onAdd={() => onAddCardExpense(card.id)}
                  onEdit={() => { setEditCardId(card.id); setCardFormOpen(true); }}
                  onArchive={() => {
                    dispatch({ kind: "UPDATE_CREDIT_CARD", cardId: card.id, update: { archived: true } } as any);
                    toast.show("Cartão arquivado");
                  }}
                  onDelete={() => {
                    dispatch({ kind: "DELETE_CREDIT_CARD", cardId: card.id });
                    toast.show("Cartão excluído");
                  }}
                />
              );
            })}
          </ul>
        )}

      </div>
      </div>

      <CardForm
        open={cardFormOpen}
        groupId={groupId}
        editCardId={editCardId}
        onClose={() => setCardFormOpen(false)}
      />
    </div>
  );
}


function ArchivedCardRow({
  card,
  currency,
  onRestore,
}: {
  card: CreditCard;
  currency: Currency;
  onRestore: () => void;
}) {
  return (
    <li className="card-row card-row--archived">
      <div className="card-row__main">
        <span className="card-row__icon">
          <CardIcon size={22} />
        </span>
        <span className="card-row__info">
          <span className="card-row__name">{card.name}</span>
          <span className="card-row__date">Fecha em {card.dateLabel}</span>
          <span className="card-row__limit">
            Limite {formatMoney(card.totalLimit, currency)}
          </span>
        </span>
      </div>
      <button
        type="button"
        className="card-row__restore"
        onClick={onRestore}
      >
        Restaurar
      </button>
    </li>
  );
}
