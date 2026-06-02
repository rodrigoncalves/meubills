import { useState } from "react";
import { alerts, cards, resolveGroup, summary } from "@/data/mock";
import { Alerts } from "./Alerts";
import { CardsSection } from "./CardsSection";
import { Hero } from "./Hero";
import { TopBar } from "./TopBar";
import "./HomeScreen.css";

interface Props {
  groupId: string;
  monthLabel: string;
  onOpenGroupSwitcher: () => void;
  onOpenMonthPicker: () => void;
}

export function HomeScreen({ groupId, monthLabel, onOpenGroupSwitcher, onOpenMonthPicker }: Props) {
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
        summary={summary}
        currency={group.currency}
        visible={visible}
        onToggleVisible={() => setVisible((v) => !v)}
      />
      <Alerts alerts={alerts} currency={group.currency} visible={visible} />
      <CardsSection cards={cards} currency={group.currency} visible={visible} />
    </div>
  );
}
