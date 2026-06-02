import { ArrowDownIcon, ReceiptIcon } from "@/components/icons";
import type { Currency, PendingAlerts } from "@/data/types";
import { maskMoney } from "@/lib/format";
import "./Alerts.css";

interface Props {
  alerts: PendingAlerts;
  currency: Currency;
  visible: boolean;
}

export function Alerts({ alerts, currency, visible }: Props) {
  return (
    <section className="alerts">
      <h2 className="section-title">Pendências e alertas</h2>

      <div className="alerts__grid">
        <AlertCard
          tone="expense"
          icon={<ArrowDownIcon size={22} />}
          count={alerts.pendingExpenses.count}
          label="Despesas pendentes"
          value={maskMoney(visible, alerts.pendingExpenses.total, currency)}
        />
        <AlertCard
          tone="credit"
          icon={<ReceiptIcon size={22} />}
          count={alerts.closedInvoices.count}
          label="Faturas fechadas"
          value={maskMoney(visible, alerts.closedInvoices.total, currency)}
        />
      </div>
    </section>
  );
}

function AlertCard({
  tone,
  icon,
  count,
  label,
  value,
}: {
  tone: "expense" | "credit";
  icon: React.ReactNode;
  count: number;
  label: string;
  value: string;
}) {
  return (
    <button className="alert-card">
      <div className="alert-card__head">
        <span className="alert-card__icon">{icon}</span>
        <span className={`alert-card__badge alert-card__badge--${tone}`}>{count}</span>
      </div>
      <span className="alert-card__label">{label}</span>
      <span className={`alert-card__value alert-card__value--${tone} tnum`}>{value}</span>
    </button>
  );
}
