import { Modal } from "@/components/ui";
import { Settings } from "./Settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-5xl h-[85vh] overflow-hidden flex flex-col p-0 bg-background"
    >
      <Settings />
    </Modal>
  );
}
