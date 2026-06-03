import { useMemo, useState } from "react";
import { CardIcon, PlusIcon } from "@/components/icons";
import type { CreditCard, Currency } from "@/data/types";
import { formatMoney, maskMoney } from "@/lib/format";
import "./CardsSection.css";

interface Props {
  cards: CreditCard[];
  currency: Currency;
  visible: boolean;
}

type Tab = "open" | "closed";

export function CardsSection({ cards, currency, visible }: Props) {
  const [tab, setTab] = useState<Tab>("open");

  const filtered = useMemo(
    () => cards.filter((c) => (tab === "open" ? c.status === "open" : c.status !== "open")),
    [cards, tab],
  );

  const total = filtered.reduce((sum, c) => sum + c.invoiceAmount, 0);

  return (
    <section className="cards">
      <div className="cards__title-row">
        <h2 className="section-title">Cartões de crédito</h2>
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

        <ul className="cards__list">
          {filtered.map((card) => (
            <CardRow key={card.id} card={card} currency={currency} visible={visible} />
          ))}
        </ul>

        <div className="cards__total">
          <span>TOTAL</span>
          <span className="tnum">{maskMoney(visible, total, currency)}</span>
        </div>
      </div>
    </section>
  );
}

function CardRow({
  card,
  currency,
  visible,
}: {
  card: CreditCard;
  currency: Currency;
  visible: boolean;
}) {
  const isOpen = card.status === "open";
  const dateText = isOpen ? `Fecha em ${card.dateLabel}` : `Vence em ${card.dateLabel}`;

  return (
    <li className="card-row">
      <button className="card-row__main" aria-label={`Abrir fatura ${card.name}`}>
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
        <span className="card-row__amount tnum">
          {maskMoney(visible, card.invoiceAmount, currency)}
        </span>
      </button>

      <div className="card-row__action">
        <CardAction card={card} />
      </div>
    </li>
  );
}

function CardAction({ card }: { card: CreditCard }) {
  if (card.status === "open") {
    return (
      <button className="card-action card-action--add" aria-label="Adicionar despesa no cartão">
        <PlusIcon size={18} />
      </button>
    );
  }
  if (card.status === "closed-pending") {
    return <button className="card-action card-action--pay">Pagar</button>;
  }
  return <span className="card-action card-action--paid">Fatura paga</span>;
}
