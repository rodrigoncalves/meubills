import { consolidated, groups } from "@/data/mock";
import { BottomSheet } from "./BottomSheet";
import { GroupList } from "./GroupList";

interface Props {
  open: boolean;
  onClose: () => void;
  activeId: string;
  onSelect: (id: string) => void;
}

export function GroupSheet({ open, onClose, activeId, onSelect }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Grupos financeiros">
      <GroupList
        groups={groups}
        consolidated={consolidated}
        activeId={activeId}
        onSelect={(id) => {
          onClose();
          onSelect(id);
        }}
      />
    </BottomSheet>
  );
}
