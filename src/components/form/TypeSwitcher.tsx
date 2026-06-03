import { useState } from "react";
import { PickerSheet } from "@/components/PickerSheet";
import type { TransactionType } from "@/data/types";
import "./TypeSwitcher.css";

const LABELS: Record<TransactionType, string> = {
  despesa: "Despesa",
  receita: "Receita",
  "despesa-cartao": "Desp. Cartão",
  transferencia: "Transferência",
};

const SWITCHABLE: TransactionType[] = ["despesa", "receita", "despesa-cartao"];

interface Props {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export function TypeSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const fixed = value === "transferencia";

  return (
    <>
      <button
        type="button"
        className={`type-pill type-pill--${value}`}
        disabled={fixed}
        onClick={() => setOpen(true)}
      >
        {LABELS[value]}
        {!fixed && " ▾"}
      </button>
      <PickerSheet
        open={open}
        title="Tipo de lançamento"
        selectedId={value}
        options={SWITCHABLE.map((t) => ({ id: t, label: LABELS[t] }))}
        onSelect={(id) => onChange(id as TransactionType)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
