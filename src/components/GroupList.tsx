import type { FinancialGroup } from "@/data/types";
import { CheckIcon } from "./icons";
import "./GroupList.css";

interface Props {
  groups: FinancialGroup[];
  consolidated: FinancialGroup;
  activeId: string;
  onSelect: (id: string) => void;
}

export function GroupList({ groups, consolidated, activeId, onSelect }: Props) {
  return (
    <ul className="group-list" role="menu">
      <GroupRow group={consolidated} active={activeId === consolidated.id} onSelect={onSelect} />
      <li className="group-list__divider" role="separator" />
      {groups.map((g) => (
        <GroupRow key={g.id} group={g} active={activeId === g.id} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function GroupRow({
  group,
  active,
  onSelect,
}: {
  group: FinancialGroup;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <li role="none">
      <button
        className={`group-row${active ? " is-active" : ""}`}
        role="menuitemradio"
        aria-checked={active}
        onClick={() => onSelect(group.id)}
      >
        <span className="group-row__avatar" style={{ background: group.accent }}>
          {group.short}
        </span>
        <span className="group-row__text">
          <span className="group-row__name">{group.name}</span>
          <span className="group-row__currency">{group.currency}</span>
        </span>
        {active && (
          <span className="group-row__check">
            <CheckIcon size={18} />
          </span>
        )}
      </button>
    </li>
  );
}
