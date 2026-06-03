import { MonthPicker } from "./MonthPicker";
import "./MonthSheet.css";

interface Props {
  open: boolean;
  onClose: () => void;
  month: number;
  year: number;
  onSelect: (month: number, year: number) => void;
}

export function MonthSheet({ open, onClose, month, year, onSelect }: Props) {
  if (!open) return null;

  return (
    <div className="month-sheet" role="dialog" aria-modal="true" aria-label="Selecionar mês">
      <button type="button" className="month-sheet__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="month-sheet__panel">
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
    </div>
  );
}
