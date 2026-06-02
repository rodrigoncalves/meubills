import { PickerSheet } from "@/components/PickerSheet";
import type { TransactionFilter } from "@/data/types";

const OPTIONS: { id: TransactionFilter; label: string }[] = [
  { id: "all", label: "Todas as transações" },
  { id: "despesa", label: "Despesas" },
  { id: "receita", label: "Receitas" },
  { id: "transferencia", label: "Transferências" },
];

interface Props {
  open: boolean;
  value: TransactionFilter;
  onSelect: (filter: TransactionFilter) => void;
  onClose: () => void;
}

export function TypeFilterMenu({ open, value, onSelect, onClose }: Props) {
  return (
    <PickerSheet
      open={open}
      title="Transações"
      selectedId={value}
      options={OPTIONS}
      onSelect={(id) => onSelect(id as TransactionFilter)}
      onClose={onClose}
    />
  );
}

export const FILTER_LABELS: Record<TransactionFilter, string> = {
  all: "Todas",
  despesa: "Despesas",
  receita: "Receitas",
  transferencia: "Transferências",
};
