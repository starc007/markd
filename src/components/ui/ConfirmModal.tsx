import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmModal({
  actionLabel = "Delete",
  children,
  open,
  title,
  onClose,
  onConfirm,
}: {
  actionLabel?: string;
  children: ReactNode;
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="mt-4 text-sm leading-6 text-muted dark:text-tooltip-ink/65">
        {children}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {actionLabel}
        </Button>
      </div>
    </Modal>
  );
}
