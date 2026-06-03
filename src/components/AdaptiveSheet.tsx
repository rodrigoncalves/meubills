import type { ReactNode } from "react";
import "./AdaptiveSheet.css";

export interface AdaptiveSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  panelClass?: string;
  children: ReactNode;
}

/** Bottom sheet below desktop layout (1024px); centered modal on desktop. */
export function AdaptiveSheet({
  open,
  onClose,
  title,
  ariaLabel,
  panelClass,
  children,
}: AdaptiveSheetProps) {
  if (!open) return null;

  const panelClasses = ["adaptive-sheet__panel", panelClass].filter(Boolean).join(" ");

  return (
    <div
      className="adaptive-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
    >
      <button type="button" className="adaptive-sheet__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className={panelClasses}>
        <div className="adaptive-sheet__handle" aria-hidden="true" />
        {title && <h2 className="adaptive-sheet__title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
