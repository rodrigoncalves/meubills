import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import type { Currency } from "@/data/types";
import { maskMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { homeBalance, monthExpense, monthIncome } from "@/store/selectors";
import "./Hero.css";

interface Props {
  groupId: string;
  month: number;
  year: number;
  currency: Currency;
  visible: boolean;
  onToggleVisible: () => void;
}

export function Hero({ groupId, month, year, currency, visible, onToggleVisible }: Props) {
  const state = useAppState();
  const balance = homeBalance(state, groupId);
  const income = monthIncome(state, groupId, month, year);
  const expense = monthExpense(state, groupId, month, year);

  return (
    <section className="hero">
      <p className="hero__label">Saldo atual em contas</p>

      <p className="hero__balance tnum">{maskMoney(visible, balance, currency)}</p>

      <button
        className="hero__toggle"
        onClick={onToggleVisible}
        aria-label={visible ? "Ocultar valores" : "Mostrar valores"}
        aria-pressed={!visible}
      >
        {visible ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
      </button>

      <div className="hero__pair">
        <Stat
          tone="income"
          icon={<ArrowUpIcon size={20} />}
          label="Receitas"
          value={maskMoney(visible, income, currency)}
        />
        <Stat
          tone="expense"
          icon={<ArrowDownIcon size={20} />}
          label="Despesas"
          value={maskMoney(visible, expense, currency)}
        />
      </div>
    </section>
  );
}

function Stat({
  tone,
  icon,
  label,
  value,
}: {
  tone: "income" | "expense";
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="hero__stat">
      <span className={`hero__disc hero__disc--${tone}`}>{icon}</span>
      <span className="hero__stat-text">
        <span className="hero__stat-label">{label}</span>
        <span className={`hero__stat-value hero__stat-value--${tone} tnum`}>{value}</span>
      </span>
    </div>
  );
}
