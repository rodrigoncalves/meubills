import type { ReactNode } from "react";
import "./BottomSheet.css";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, ariaLabel, children }: Props) {
  if (!open) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={ariaLabel ?? title}>
      <button className="sheet__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__handle" />
        {title && <h2 className="sheet__title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
