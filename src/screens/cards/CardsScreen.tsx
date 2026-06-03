import { useMemo, useState } from "react";
import { CardIcon, PlusIcon } from "@/components/icons";
import { resolveGroup } from "@/data/mock";
import type { CreditCard, Currency, InvoiceStatus } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { cardsByGroup, invoiceAmount, invoiceForMonth } from "@/store/selectors";
import { InvoiceDetailScreen } from "./InvoiceDetailScreen";
import "./CardsScreen.css";

interface Props {
  activeGroupId: string;
  onAddCardExpense: (cardId: string) => void;
}

type DetailView = { cardId: string; month: number; year: number };

export function CardsScreen({ activeGroupId, onAddCardExpense }: Props) {
  const state = useAppState();
  const [groupId, setGroupId] = useState(activeGroupId);
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [detail, setDetail] = useState<DetailView | null>(null);

  const today = new Date();
  const group = resolveGroup(groupId);

  const allCards = useMemo(() => cardsByGroup(state, groupId), [state, groupId]);

  const filtered = useMemo(
    () => allCards.filter((c) => (tab === "open" ? c.status === "open" : c.status !== "open")),
    [allCards, tab],
  );

  const total = filtered.reduce((sum, c) => sum + c.invoiceAmount, 0);

  const handleCardTap = (cardId: string) => {
    setDetail({ cardId, month: today.getMonth(), year: today.getFullYear() });
  };

  if (detail) {
    return (
      <InvoiceDetailScreen
        cardId={detail.cardId}
        month={detail.month}
        year={detail.year}
        onBack={() => setDetail(null)}
        onAddCardExpense={onAddCardExpense}
      />
    );
  }

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

        {filtered.length === 0 ? (
          <p className="cards-screen__empty">Nenhum cartão neste grupo.</p>
        ) : (
          <ul className="cards-screen__list">
            {filtered.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                currency={group.currency}
                onTap={() => handleCardTap(card.id)}
                onAdd={() => onAddCardExpense(card.id)}
              />
            ))}
          </ul>
        )}

        <div className="cards-screen__total">
          <span>TOTAL</span>
          <span className="tnum">{formatMoney(total, group.currency)}</span>
        </div>
      </div>
    </div>
  );
}

function CardRow({
  card,
  currency,
  onTap,
  onAdd,
}: {
  card: CreditCard;
  currency: Currency;
  onTap: () => void;
  onAdd: () => void;
}) {
  const isOpen = card.status === "open";
  const dateText = isOpen ? `Fecha em ${card.dateLabel}` : `Vence em ${card.dateLabel}`;

  return (
    <li className="card-row">
      <button className="card-row__main" type="button" aria-label={`Ver fatura ${card.name}`} onClick={onTap}>
        <span className="card-row__icon">
          <CardIcon size={22} />
        </span>
        <span className="card-row__info">
          <span className="card-row__name">{card.name}</span>
          <span className="card-row__date">{dateText}</span>
          <span className="card-row__limit">
            Limite disponível {formatMoney(card.availableLimit, currency)}
          </span>
        </span>
        <span className="card-row__amount tnum">{formatMoney(card.invoiceAmount, currency)}</span>
      </button>

      <div className="card-row__action">
        <CardAction status={card.status} onAdd={onAdd} />
      </div>
    </li>
  );
}

function CardAction({
  status,
  onAdd,
}: {
  status: InvoiceStatus;
  onAdd: () => void;
}) {
  if (status === "open") {
    return (
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
    );
  }
  if (status === "closed-pending") {
    return <button type="button" className="card-action card-action--pay">Pagar</button>;
  }
  return <span className="card-action card-action--paid">Fatura paga</span>;
}
