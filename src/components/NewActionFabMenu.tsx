import { PlusIcon } from "./icons";
import { type NewAction, newActionItems } from "./NewActionsList";
import "./NewActionFabMenu.css";

interface Props {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (action: NewAction) => void;
}

const order: NewAction[] = ["receita", "despesa-cartao", "transferencia", "despesa"];

export function NewActionFabMenu({ open, onToggle, onClose, onSelect }: Props) {
  const items = order
    .map((id) => newActionItems.find((it) => it.id === id))
    .filter((it): it is (typeof newActionItems)[number] => Boolean(it));

  return (
    <div className={`fab-menu${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="fab-menu__backdrop"
        aria-label="Fechar menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <ul className="fab-menu__items" role="menu" aria-hidden={!open}>
        {items.map(({ id, label, iconTone, Icon }, i) => (
          <li key={id} className={`fab-menu__slot fab-menu__slot--${i}`} role="none">
            <button
              type="button"
              className="fab-menu__action"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                onClose();
                onSelect(id);
              }}
            >
              <span className={`fab-menu__disc fab-menu__disc--${iconTone}`}>
                <Icon size={22} />
              </span>
              <span className="fab-menu__label">{label}</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`fab-menu__fab${open ? " is-open" : ""}`}
        aria-label={open ? "Fechar" : "Novo lançamento"}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="fab-menu__fab-icon">
          <PlusIcon size={22} />
        </span>
      </button>
    </div>
  );
}
