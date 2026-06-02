import { BottomSheet } from "./BottomSheet";
import { MonthPicker } from "./MonthPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  month: number;
  year: number;
  onSelect: (month: number, year: number) => void;
}

export function MonthSheet({ open, onClose, month, year, onSelect }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Selecionar mês">
      <div className="month-sheet__inner">
        <MonthPicker
          month={month}
          year={year}
          onSelect={(m, y) => {
            onClose();
            onSelect(m, y);
          }}
          onCancel={onClose}
        />
      </div>
    </BottomSheet>
  );
}
