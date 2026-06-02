import { ChevronDownIcon } from "@/components/icons";
import type { FinancialGroup } from "@/data/types";
import "./TopBar.css";

interface Props {
  group: FinancialGroup;
  month: string;
  onGroupClick: () => void;
  onMonthClick: () => void;
}

export function TopBar({ group, month, onGroupClick, onMonthClick }: Props) {
  return (
    <header className="topbar">
      <button
        className="topbar__group"
        onClick={onGroupClick}
        aria-label={`Grupo ${group.name}, trocar grupo`}
      >
        <span className="topbar__avatar" style={{ background: group.accent }}>
          {group.short}
        </span>
      </button>

      <button className="topbar__month" onClick={onMonthClick} aria-label="Selecionar mês">
        <span>{month}</span>
        <ChevronDownIcon size={18} />
      </button>

      <button className="topbar__action" aria-label="Recompensas">
        <span className="topbar__dot" />
      </button>
    </header>
  );
}
