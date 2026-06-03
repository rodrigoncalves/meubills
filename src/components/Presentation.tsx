import type { ReactNode } from "react";
import "./Presentation.css";

interface Props {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  panelClass?: string;
  /** When false, clicking the dimmed backdrop does not call onClose. */
  closeOnBackdropClick?: boolean;
}

/** Full-screen overlay below desktop layout (1024px); centered modal on desktop. */
export function Presentation({
  open,
  onClose,
  ariaLabel,
  children,
  panelClass,
  closeOnBackdropClick = true,
}: Props) {
  if (!open) return null;
  return (
    <div className="presentation" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      {closeOnBackdropClick ? (
        <button type="button" className="presentation__backdrop" aria-label="Fechar" onClick={onClose} />
      ) : (
        <div className="presentation__backdrop" aria-hidden="true" />
      )}
      <div className={`presentation__panel${panelClass ? ` ${panelClass}` : ""}`}>{children}</div>
    </div>
  );
}
