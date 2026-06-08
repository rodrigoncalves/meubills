import { useState } from "react";
import { alerts, cards, resolveGroup } from "@/data/mock";
import { Alerts } from "./Alerts";
import { CardsSection } from "./CardsSection";
import { Hero } from "./Hero";
import { TopBar } from "./TopBar";
import "./HomeScreen.css";

interface Props {
  groupId: string;
  month: number;
  year: number;
  monthLabel: string;
  onOpenGroupSwitcher: () => void;
  onOpenMonthPicker: () => void;
  onOpenCards?: () => void;
  onCardTap?: (cardId: string, month: number, year: number) => void;
}

export function HomeScreen({
  groupId,
  month,
  year,
  monthLabel,
  onOpenGroupSwitcher,
  onOpenMonthPicker,
  onOpenCards,
  onCardTap,
}: Props) {
  const [visible, setVisible] = useState(true);
  const group = resolveGroup(groupId);

  return (
    <div className="home">
      <TopBar
        group={group}
        month={monthLabel}
        onGroupClick={onOpenGroupSwitcher}
        onMonthClick={onOpenMonthPicker}
      />
      <Hero
        groupId={groupId}
        month={month}
        year={year}
        currency={group.currency}
        visible={visible}
        onToggleVisible={() => setVisible((v) => !v)}
      />
      <Alerts alerts={alerts} currency={group.currency} visible={visible} />
      <CardsSection
        cards={cards}
        currency={group.currency}
        visible={visible}
        groupId={groupId}
        onOpenCards={onOpenCards}
        onCardTap={onCardTap}
      />
    </div>
  );
}
