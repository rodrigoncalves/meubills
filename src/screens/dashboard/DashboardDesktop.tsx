import { useState } from "react";
import { GroupList } from "@/components/GroupList";
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { MonthPicker } from "@/components/MonthPicker";
import { alerts, cards, consolidated, groups, resolveGroup } from "@/data/mock";
import { Alerts } from "@/screens/home/Alerts";
import { CardsSection } from "@/screens/home/CardsSection";
import { SummaryCards } from "./SummaryCards";
import "./DashboardDesktop.css";

interface Props {
  groupId: string;
  onSelectGroup: (id: string) => void;
  month: number;
  year: number;
  onSelectMonth: (month: number, year: number) => void;
  monthLabel: string;
  onOpenCards?: () => void;
}

export function DashboardDesktop({
  groupId,
  onSelectGroup,
  month,
  year,
  onSelectMonth,
  monthLabel,
  onOpenCards,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [groupOpen, setGroupOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const group = resolveGroup(groupId);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__popover-anchor">
          <button
            className="dashboard__group"
            onClick={() => setGroupOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={groupOpen}
          >
            <span className="dashboard__avatar" style={{ background: group.accent }}>
              {group.short}
            </span>
            <span className="dashboard__group-name">{group.name}</span>
            <ChevronDownIcon size={18} />
          </button>

          {groupOpen && (
            <>
              <button className="popover-backdrop" onClick={() => setGroupOpen(false)} />
              <div className="popover popover--left">
                <GroupList
                  groups={groups}
                  consolidated={consolidated}
                  activeId={groupId}
                  onSelect={(id) => {
                    setGroupOpen(false);
                    onSelectGroup(id);
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="dashboard__header-actions">
          <div className="dashboard__popover-anchor">
            <button
              className="dashboard__month"
              onClick={() => setMonthOpen((o) => !o)}
              aria-haspopup="dialog"
              aria-expanded={monthOpen}
            >
              <span>{monthLabel}</span>
              <ChevronDownIcon size={18} />
            </button>

            {monthOpen && (
              <>
                <button className="popover-backdrop" onClick={() => setMonthOpen(false)} />
                <div className="popover popover--right">
                  <MonthPicker
                    month={month}
                    year={year}
                    onSelect={(m, y) => {
                      setMonthOpen(false);
                      onSelectMonth(m, y);
                    }}
                    onCancel={() => setMonthOpen(false)}
                  />
                </div>
              </>
            )}
          </div>

          <button
            className="dashboard__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar valores" : "Mostrar valores"}
            aria-pressed={!visible}
          >
            {visible ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
          </button>
        </div>
      </header>

      <SummaryCards
        groupId={groupId}
        month={month}
        year={year}
        cards={cards}
        currency={group.currency}
        visible={visible}
        onOpenCards={onOpenCards}
      />

      <div className="dashboard__grid">
        <div className="dashboard__main">
          <CardsSection cards={cards} currency={group.currency} visible={visible} groupId={groupId} />
        </div>
        <div className="dashboard__aside">
          <Alerts alerts={alerts} currency={group.currency} visible={visible} />
        </div>
      </div>
    </div>
  );
}
