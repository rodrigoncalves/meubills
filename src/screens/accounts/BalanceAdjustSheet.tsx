import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { AmountInput } from "@/components/form/AmountInput";
import { useToast } from "@/components/Toast";
import { resolveGroup } from "@/data/mock";
import { formatMoney } from "@/lib/format";
import { useAppDispatch, useAppState } from "@/store/AppStateProvider";
import { accountBalance } from "@/store/selectors";
import type { AdjustMode } from "@/store/types";
import "./BalanceAdjustSheet.css";

interface Props {
  accountId: string | null;
  onClose: () => void;
}

export function BalanceAdjustSheet({ accountId, onClose }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const account = state.accounts.find((a) => a.id === accountId);
  const currency = account ? resolveGroup(account.groupId).currency : "BRL";
  const current = account ? accountBalance(state, account.id) : 0;

  const [target, setTarget] = useState(0);
  const [mode, setMode] = useState<AdjustMode>("create-tx");
  const [description, setDescription] = useState("");

  const diff = Math.round((target - current) * 100) / 100;
  const disabled = diff === 0;

  const save = () => {
    if (!account || disabled) return;
    dispatch({
      kind: "ADJUST_BALANCE",
      input: { accountId: account.id, targetBalance: target, mode, description: description || undefined },
    });
    toast.show("Saldo reajustado");
    onClose();
  };

  return (
    <BottomSheet open={!!accountId} onClose={onClose} title="Reajuste de saldo">
      <AmountInput value={target} currency={currency} onChange={setTarget} />
      <div className="adjust__current">
        <span>Saldo atual da conta</span>
        <strong>{formatMoney(current, currency)}</strong>
      </div>
      <p className="adjust__hint">Você gostaria de…</p>
      <div className="adjust__options">
        <button
          type="button"
          className={`adjust__option${mode === "create-tx" ? " adjust__option--active" : ""}`}
          onClick={() => setMode("create-tx")}
        >
          <strong>CRIAR TRANSAÇÃO DE AJUSTE</strong>
          <span>Para ajustar seu saldo uma transação de ajuste será criada.</span>
        </button>
        <button
          type="button"
          className={`adjust__option${mode === "modify-initial" ? " adjust__option--active" : ""}`}
          onClick={() => setMode("modify-initial")}
        >
          <strong>MODIFICAR SALDO INICIAL</strong>
          <span>Altera o saldo inicial. Alguns saldos de fim de mês serão impactados.</span>
        </button>
      </div>
      <label className="adjust__desc">
        <span>Descrição</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="adjust__footer">
        <button type="button" className="adjust__cancel" onClick={onClose}>
          CANCELAR
        </button>
        <button type="button" className="adjust__save" disabled={disabled} onClick={save}>
          SALVAR
        </button>
      </div>
    </BottomSheet>
  );
}
