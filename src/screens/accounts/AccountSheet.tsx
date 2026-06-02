import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { useAppState } from "@/store/AppStateProvider";
import { BalanceAdjustSheet } from "./BalanceAdjustSheet";

interface Props {
  accountId: string | null;
  onClose: () => void;
}

export function AccountSheet({ accountId, onClose }: Props) {
  const state = useAppState();
  const [adjusting, setAdjusting] = useState(false);
  const account = state.accounts.find((a) => a.id === accountId);

  return (
    <>
      <BottomSheet open={!!accountId && !adjusting} onClose={onClose} title={account?.name}>
        <ul className="picker">
          <li>
            <button type="button" className="picker__item" onClick={() => setAdjusting(true)}>
              <span className="picker__label">Reajustar saldo</span>
            </button>
          </li>
        </ul>
      </BottomSheet>
      <BalanceAdjustSheet
        accountId={adjusting ? accountId : null}
        onClose={() => {
          setAdjusting(false);
          onClose();
        }}
      />
    </>
  );
}
