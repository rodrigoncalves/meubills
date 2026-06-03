import { AdaptiveSheet } from "./AdaptiveSheet";
import "./PickerSheet.css";

export interface PickerOption {
  id: string;
  label: string;
  hint?: string;
}

interface Props {
  open: boolean;
  title: string;
  options: PickerOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function PickerSheet({ open, title, options, selectedId, onSelect, onClose }: Props) {
  return (
    <AdaptiveSheet open={open} onClose={onClose} title={title}>
      <ul className="picker" role="listbox">
        {options.map((opt) => (
          <li key={opt.id} role="none">
            <button
              type="button"
              role="option"
              aria-selected={opt.id === selectedId}
              className={`picker__item${opt.id === selectedId ? " picker__item--active" : ""}`}
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
            >
              <span className="picker__label">{opt.label}</span>
              {opt.hint && <span className="picker__hint">{opt.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
    </AdaptiveSheet>
  );
}
