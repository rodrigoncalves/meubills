import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { GroupSheet } from "@/components/GroupSheet";
import { MONTHS_LONG } from "@/components/MonthPicker";
import { MonthSheet } from "@/components/MonthSheet";
import type { NewAction } from "@/components/NewActionsList";
import { Sidebar } from "@/components/Sidebar";
import { activeGroupId } from "@/data/mock";
import type { TransactionType } from "@/data/types";
import { AccountsScreen } from "@/screens/accounts/AccountsScreen";
import { DashboardDesktop } from "@/screens/dashboard/DashboardDesktop";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { TransactionForm } from "@/screens/transaction/TransactionForm";
import { TransactionsScreen } from "@/screens/transactions/TransactionsScreen";
import "./App.css";

type Tab = "principal" | "transacoes" | "cartoes" | "mais";

export function App() {
  const [tab, setTab] = useState<Tab>("principal");
  const [groupId, setGroupId] = useState(activeGroupId);
  const [desktopView, setDesktopView] = useState<"dashboard" | "accounts" | "transactions">(
    "dashboard",
  );

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const [fabOpen, setFabOpen] = useState(false);
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [monthSheetOpen, setMonthSheetOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>("despesa");

  const monthLabel = MONTHS_LONG[month];

  const handleNewAction = (action: NewAction) => {
    const typeMap: Record<string, TransactionType> = {
      despesa: "despesa",
      receita: "receita",
      "despesa-cartao": "despesa-cartao",
      transferencia: "transferencia",
    };
    setFormType(typeMap[action] ?? "despesa");
    setFormOpen(true);
  };

  const handleSelectMonth = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="app-shell">
      <div className="app-shell__sidebar">
        <Sidebar onNewAction={handleNewAction} onSelectView={setDesktopView} />
      </div>

      <main className="app-shell__content">
        {/* Mobile */}
        <div className="mobile-only">
          {tab === "principal" ? (
            <HomeScreen
              groupId={groupId}
              month={month}
              year={year}
              monthLabel={monthLabel}
              onOpenGroupSwitcher={() => setGroupSheetOpen(true)}
              onOpenMonthPicker={() => setMonthSheetOpen(true)}
            />
          ) : tab === "transacoes" ? (
            <TransactionsScreen
              groupId={groupId}
              month={month}
              year={year}
              monthLabel={monthLabel}
            />
          ) : tab === "mais" ? (
            <AccountsScreen />
          ) : (
            <Placeholder tab={tab} />
          )}
        </div>
        {/* Desktop */}
        <div className="desktop-only">
          {desktopView === "accounts" ? (
            <AccountsScreen />
          ) : desktopView === "transactions" ? (
            <TransactionsScreen
              groupId={groupId}
              month={month}
              year={year}
              monthLabel={monthLabel}
            />
          ) : (
            <DashboardDesktop
              groupId={groupId}
              onSelectGroup={setGroupId}
              month={month}
              year={year}
              onSelectMonth={handleSelectMonth}
              monthLabel={monthLabel}
            />
          )}
        </div>
      </main>

      <div className="mobile-only app-shell__bottomnav">
        <BottomNav
          active={tab}
          onSelect={setTab}
          fabOpen={fabOpen}
          onToggleFab={() => setFabOpen((v) => !v)}
          onCloseFab={() => setFabOpen(false)}
          onSelectAction={handleNewAction}
        />
      </div>

      <div className="mobile-only">
        <GroupSheet
          open={groupSheetOpen}
          onClose={() => setGroupSheetOpen(false)}
          activeId={groupId}
          onSelect={setGroupId}
        />
        <MonthSheet
          open={monthSheetOpen}
          onClose={() => setMonthSheetOpen(false)}
          month={month}
          year={year}
          onSelect={handleSelectMonth}
        />
      </div>

      <TransactionForm
        open={formOpen}
        initialType={formType}
        initialGroupId={groupId}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

function Placeholder({ tab }: { tab: Tab }) {
  const labels: Record<Tab, string> = {
    principal: "Principal",
    transacoes: "Transações",
    cartoes: "Cartões",
    mais: "Mais",
  };
  return <div className="placeholder">{labels[tab]}</div>;
}
