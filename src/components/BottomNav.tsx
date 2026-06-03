import { CardIcon, HomeIcon, ListIcon, MoreIcon } from "./icons";
import { NewActionFabMenu } from "./NewActionFabMenu";
import type { NewAction } from "./NewActionsList";
import "./BottomNav.css";

type Tab = "principal" | "transacoes" | "cartoes" | "mais";

interface Props {
  active: Tab;
  onSelect: (tab: Tab) => void;
  fabOpen: boolean;
  onToggleFab: () => void;
  onCloseFab: () => void;
  onSelectAction: (action: NewAction) => void;
}

const items: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "principal", label: "Principal", Icon: HomeIcon },
  { id: "transacoes", label: "Transações", Icon: ListIcon },
  { id: "cartoes", label: "Cartões", Icon: CardIcon },
  { id: "mais", label: "Mais", Icon: MoreIcon },
];

export function BottomNav({
  active,
  onSelect,
  fabOpen,
  onToggleFab,
  onCloseFab,
  onSelectAction,
}: Props) {
  const [left, right] = [items.slice(0, 2), items.slice(2)];

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <NewActionFabMenu
        open={fabOpen}
        onToggle={onToggleFab}
        onClose={onCloseFab}
        onSelect={onSelectAction}
      />
      <div className="bottom-nav__row">
        {left.map((it) => (
          <NavButton key={it.id} {...it} active={active === it.id} onSelect={onSelect} />
        ))}

        <div className="bottom-nav__fab-spacer" aria-hidden="true" />

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
        <Icon size={22} />
      </span>
      <span className="bottom-nav__label">{label}</span>
    </button>
  );
}
