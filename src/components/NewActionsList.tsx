import { CardIcon, TransferIcon, TrendDownIcon, TrendUpIcon } from "./icons";
import "./NewActionsList.css";

export type NewAction = "despesa" | "receita" | "despesa-cartao" | "transferencia";

interface ActionDef {
  id: NewAction;
  label: string;
  tone: "expense" | "income" | "credit" | "balance";
  Icon: typeof CardIcon;
}

const actions: ActionDef[] = [
  { id: "despesa", label: "Despesa", tone: "expense", Icon: TrendDownIcon },
  { id: "receita", label: "Receita", tone: "income", Icon: TrendUpIcon },
  { id: "despesa-cartao", label: "Despesa cartão", tone: "credit", Icon: CardIcon },
  { id: "transferencia", label: "Transferência", tone: "balance", Icon: TransferIcon },
];

interface Props {
  onSelect: (action: NewAction) => void;
}

export function NewActionsList({ onSelect }: Props) {
  return (
    <ul className="new-actions" role="menu">
      {actions.map(({ id, label, tone, Icon }) => (
        <li key={id} role="none">
          <button className="new-actions__item" role="menuitem" onClick={() => onSelect(id)}>
            <span className={`new-actions__icon new-actions__icon--${tone}`}>
              <Icon size={20} />
            </span>
            <span className="new-actions__label">{label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
