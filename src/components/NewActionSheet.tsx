import { BottomSheet } from "./BottomSheet";
import { type NewAction, NewActionsList } from "./NewActionsList";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (action: NewAction) => void;
}

export function NewActionSheet({ open, onClose, onSelect }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Novo lançamento">
      <NewActionsList
        onSelect={(a) => {
          onClose();
          onSelect(a);
        }}
      />
    </BottomSheet>
  );
}
