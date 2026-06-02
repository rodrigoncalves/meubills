import { CardIcon, HomeIcon, ListIcon, MoreIcon, PlusIcon } from "./icons";
import "./BottomNav.css";

type Tab = "principal" | "transacoes" | "cartoes" | "mais";

interface Props {
  active: Tab;
  onSelect: (tab: Tab) => void;
  onAdd: () => void;
}

const items: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "principal", label: "Principal", Icon: HomeIcon },
  { id: "transacoes", label: "Transações", Icon: ListIcon },
  { id: "cartoes", label: "Cartões", Icon: CardIcon },
  { id: "mais", label: "Mais", Icon: MoreIcon },
];

export function BottomNav({ active, onSelect, onAdd }: Props) {
  const [left, right] = [items.slice(0, 2), items.slice(2)];

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <div className="bottom-nav__row">
        {left.map((it) => (
          <NavButton key={it.id} {...it} active={active === it.id} onSelect={onSelect} />
        ))}

        <button className="bottom-nav__fab" onClick={onAdd} aria-label="Novo lançamento">
          <PlusIcon size={30} />
        </button>

        {right.map((it) => (
          <NavButton key={it.id} {...it} active={active === it.id} onSelect={onSelect} />
        ))}
      </div>
    </nav>
  );
}

function NavButton({
  id,
  label,
  Icon,
  active,
  onSelect,
}: {
  id: Tab;
  label: string;
  Icon: typeof HomeIcon;
  active: boolean;
  onSelect: (t: Tab) => void;
}) {
  return (
    <button
      className={`bottom-nav__item${active ? " is-active" : ""}`}
      onClick={() => onSelect(id)}
      aria-current={active ? "page" : undefined}
    >
      <span className="bottom-nav__icon">
        <Icon size={24} />
      </span>
      <span className="bottom-nav__label">{label}</span>
    </button>
  );
}
