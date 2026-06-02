import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import type { Currency, HomeSummary } from "@/data/types";
import { maskMoney } from "@/lib/format";
import "./Hero.css";

interface Props {
  summary: HomeSummary;
  currency: Currency;
  visible: boolean;
  onToggleVisible: () => void;
}

export function Hero({ summary, currency, visible, onToggleVisible }: Props) {
  return (
    <section className="hero">
      <p className="hero__label">Saldo atual em contas</p>

      <p className="hero__balance tnum">{maskMoney(visible, summary.balance, currency)}</p>

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
          value={maskMoney(visible, summary.income, currency)}
        />
        <Stat
          tone="expense"
          icon={<ArrowDownIcon size={20} />}
          label="Despesas"
          value={maskMoney(visible, summary.expense, currency)}
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
