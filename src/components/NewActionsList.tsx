import { CardIcon, TransferIcon, TrendDownIcon, TrendUpIcon } from "./icons";

export type NewAction = "despesa" | "receita" | "despesa-cartao" | "transferencia";

interface ActionDef {
  id: NewAction;
  label: string;
  iconTone: "expense" | "income" | "credit" | "info";
  Icon: typeof CardIcon;
}

export const newActionItems: ActionDef[] = [
  { id: "despesa", label: "Despesa", iconTone: "expense", Icon: TrendDownIcon },
  { id: "receita", label: "Receita", iconTone: "income", Icon: TrendUpIcon },
  { id: "despesa-cartao", label: "Despesa cartão", iconTone: "credit", Icon: CardIcon },
  { id: "transferencia", label: "Transferência", iconTone: "info", Icon: TransferIcon },
];

interface Props {
  onSelect: (action: NewAction) => void;
}

export function NewActionsList({ onSelect }: Props) {
  return (
    <ul className="action-menu" role="menu">
      {newActionItems.map(({ id, label, iconTone, Icon }) => (
        <li key={id} role="none">
          <button type="button" className="action-menu__item" role="menuitem" onClick={() => onSelect(id)}>
            <span className={`action-menu__icon action-menu__icon--${iconTone}`}>
              <Icon size={22} />
            </span>
            <span className="action-menu__label">{label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
