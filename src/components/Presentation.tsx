import type { ReactNode } from "react";
import "./Presentation.css";

interface Props {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}

/** Full-screen overlay on mobile, centered modal on desktop. */
export function Presentation({ open, onClose, ariaLabel, children }: Props) {
  if (!open) return null;
  return (
    <div className="presentation" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <button className="presentation__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="presentation__panel">{children}</div>
    </div>
  );
}
