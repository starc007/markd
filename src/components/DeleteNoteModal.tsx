import { Modal, ModalFooter, Button } from "@/components/ui";

interface DeleteNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  noteTitle?: string;
}

export function DeleteNoteModal({
  isOpen,
  onClose,
  onConfirm,
  noteTitle = "Untitled",
}: DeleteNoteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Note">
      <p className="text-muted-foreground">
        Are you sure you want to delete "{noteTitle}"? This action cannot be
        undone.
      </p>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}
