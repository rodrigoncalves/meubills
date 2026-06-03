import { useMemo, useState } from "react";
import { resolveGroup } from "@/data/mock";
import { formatMoney } from "@/lib/format";
import { useAppState } from "@/store/AppStateProvider";
import { accountBalance } from "@/store/selectors";
import { AccountSheet } from "./AccountSheet";
import "./AccountsScreen.css";

export function AccountsScreen() {
  const state = useAppState();
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  const byGroup = useMemo(() => {
    return state.groups.map((g) => ({
      group: g,
      accounts: state.accounts.filter((a) => a.groupId === g.id),
    }));
  }, [state.groups, state.accounts]);

  return (
    <div className="accounts">
      <h1 className="accounts__title">Contas</h1>
      {byGroup.map(({ group, accounts }) =>
        accounts.length === 0 ? null : (
          <section key={group.id} className="accounts__group">
            <h2 className="accounts__group-name">{group.name}</h2>
            <ul className="accounts__list">
              {accounts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="accounts__row"
                    onClick={() => setActiveAccount(a.id)}
                  >
                    <span>{a.name}</span>
                    <span>
                      {formatMoney(accountBalance(state, a.id), resolveGroup(a.groupId).currency)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
      <AccountSheet accountId={activeAccount} onClose={() => setActiveAccount(null)} />
    </div>
  );
}
