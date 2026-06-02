import { useState } from "react";
import {
  CardIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  HomeIcon,
  ListIcon,
  MoreIcon,
  PlusIcon,
  ReceiptIcon,
} from "./icons";
import { type NewAction, NewActionsList } from "./NewActionsList";
import "./Sidebar.css";

interface Item {
  id: string;
  label: string;
  Icon: typeof HomeIcon;
}

const items: Item[] = [
  { id: "dashboard", label: "Dashboard", Icon: HomeIcon },
  { id: "contas", label: "Contas", Icon: ReceiptIcon },
  { id: "transacoes", label: "Transações", Icon: ListIcon },
  { id: "cartoes", label: "Cartões de crédito", Icon: CardIcon },
  { id: "relatorios", label: "Relatórios", Icon: ChevronDownIcon },
  { id: "mais", label: "Mais opções", Icon: MoreIcon },
];

interface Props {
  onNewAction: (action: NewAction) => void;
  onSelectView: (view: "dashboard" | "accounts" | "transactions") => void;
}

export function Sidebar({ onNewAction, onSelectView }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (action: NewAction) => {
    setMenuOpen(false);
    onNewAction(action);
  };

  return (
    <aside className={`sidebar${expanded ? " is-expanded" : ""}`}>
      <button
        className="sidebar__collapse"
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? "Recolher menu" : "Expandir menu"}
      >
        <ChevronLeftIcon size={16} className={expanded ? "" : "is-flipped"} />
      </button>

      <div className="sidebar__top">
        <div className="sidebar__brand">
          <span className="sidebar__logo">M</span>
          {expanded && <span className="sidebar__brand-name">MeuBills</span>}
        </div>
      </div>

      <div className="sidebar__new-wrap">
        <button
          className="sidebar__new"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <PlusIcon size={20} />
          {expanded && <span>Novo</span>}
        </button>

        {menuOpen && (
          <>
            <button
              className="sidebar__menu-backdrop"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="sidebar__menu" role="presentation">
              <NewActionsList onSelect={handleSelect} />
            </div>
          </>
        )}
      </div>

      <nav className="sidebar__nav">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar__item${active === id ? " is-active" : ""}`}
            onClick={() => {
              setActive(id);
              if (id === "dashboard") onSelectView("dashboard");
              else if (id === "contas") onSelectView("accounts");
              else if (id === "transacoes") onSelectView("transactions");
            }}
            aria-current={active === id ? "page" : undefined}
            title={label}
          >
            <span className="sidebar__item-icon">
              <Icon size={22} />
            </span>
            {expanded && <span className="sidebar__item-label">{label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__item" title="Configurações">
          <span className="sidebar__item-icon">
            <MoreIcon size={22} />
          </span>
          {expanded && <span className="sidebar__item-label">Configurações</span>}
        </button>
      </div>
    </aside>
  );
}
