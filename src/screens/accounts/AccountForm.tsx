import { useState } from "react";
import { AdaptiveSheet } from "@/components/AdaptiveSheet";
import { AmountInput } from "@/components/form/AmountInput";
import { useToast } from "@/components/Toast";
import { resolveGroup } from "@/data/mock";
import type { Account } from "@/data/types";
import { useAppDispatch } from "@/store/AppStateProvider";
import "./BalanceAdjustSheet.css";

interface Props {
  account?: Account;
  open: boolean;
  groupId: string;
  onClose: () => void;
}

export function AccountForm({ account, open, groupId, onClose }: Props) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const currency = resolveGroup(account?.groupId ?? groupId).currency;

  const [name, setName] = useState(account?.name ?? "");
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance ?? 0);
  const [includeInTotal, setIncludeInTotal] = useState(account?.includeInTotal ?? true);

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    if (account) {
      dispatch({
        kind: "UPDATE_ACCOUNT",
        accountId: account.id,
        update: { name: name.trim(), initialBalance, includeInTotal },
      });
      toast.show("Conta atualizada");
    } else {
      dispatch({
        kind: "ADD_ACCOUNT",
        account: { name: name.trim(), groupId, initialBalance, includeInTotal },
      });
      toast.show("Conta criada");
    }
    onClose();
  };

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={account ? "Editar conta" : "Nova conta"}
      panelClass="adaptive-sheet__panel--wide"
    >
      <label className="adjust__desc">
        <span>Nome da conta</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Conta Corrente" autoFocus />
      </label>
      <p className="adjust__hint">Saldo inicial</p>
      <AmountInput value={initialBalance} currency={currency} onChange={setInitialBalance} />
      <label className="adjust__desc adjust__desc--inline">
        <span>Incluir no saldo total</span>
        <input type="checkbox" checked={includeInTotal} onChange={(e) => setIncludeInTotal(e.target.checked)} />
      </label>
      <div className="adjust__footer">
        <button type="button" className="adjust__cancel" onClick={onClose}>
          CANCELAR
        </button>
        <button type="button" className="adjust__save" disabled={!canSave} onClick={save}>
          SALVAR
        </button>
      </div>
    </AdaptiveSheet>
  );
}
