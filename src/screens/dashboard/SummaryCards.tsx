import { ArrowDownIcon, ArrowUpIcon, BankIcon, CardIcon } from "@/components/icons";
import type { CreditCard, Currency } from "@/data/types";
import { maskMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { homeBalance, monthExpense, monthIncome } from "@/store/selectors";
import "./SummaryCards.css";

interface Props {
  groupId: string;
  month: number;
  year: number;
  cards: CreditCard[];
  currency: Currency;
  visible: boolean;
  onOpenCards?: () => void;
}

export function SummaryCards({
  groupId,
  month,
  year,
  cards,
  currency,
  visible,
  onOpenCards,
}: Props) {
  const state = useAppState();
  const balance = homeBalance(state, groupId);
  const income = monthIncome(state, groupId, month, year);
  const expense = monthExpense(state, groupId, month, year);
  const cardsTotal = cards.reduce((sum, c) => sum + c.invoiceAmount, 0);

  const items = [
    {
      tone: "balance" as const,
      icon: <BankIcon size={26} />,
      label: "Saldo atual em contas",
      value: maskMoney(visible, balance, currency),
    },
    {
      tone: "income" as const,
      icon: <ArrowUpIcon size={30} />,
      label: "Receitas",
      value: maskMoney(visible, income, currency),
    },
    {
      tone: "expense" as const,
      icon: <ArrowDownIcon size={30} />,
      label: "Despesas",
      value: maskMoney(visible, expense, currency),
    },
    {
      tone: "credit" as const,
      icon: <CardIcon size={26} />,
      label: "Cartões de crédito",
      value: maskMoney(visible, cardsTotal, currency),
      onClick: onOpenCards,
    },
  ];

  return (
    <div className="summary-cards">
      {items.map((it) => {
        const className = `summary-card${it.onClick ? " summary-card--action" : ""}`;

        if (it.onClick) {
          return (
            <button
              key={it.label}
              type="button"
              className={className}
              onClick={it.onClick}
              aria-label={`${it.label}: ${it.value}`}
            >
              <span className={`summary-card__icon summary-card__icon--${it.tone}`}>{it.icon}</span>
              <span className="summary-card__text">
                <span className="summary-card__label">{it.label}</span>
                <span className={`summary-card__value summary-card__value--${it.tone} tnum`}>
                  {it.value}
                </span>
              </span>
            </button>
          );
        }

        return (
          <div key={it.label} className={className}>
            <span className={`summary-card__icon summary-card__icon--${it.tone}`}>{it.icon}</span>
            <span className="summary-card__text">
              <span className="summary-card__label">{it.label}</span>
              <span className={`summary-card__value summary-card__value--${it.tone} tnum`}>
                {it.value}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
