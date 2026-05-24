import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { IconButton } from "./IconButton";

const MotionDialogPanel = motion.create(DialogPanel);

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog static open={open} onClose={onClose} className="relative z-70">
          <motion.div
            className="fixed inset-0 bg-overlay-backdrop backdrop-blur-lg dark:bg-overlay-backdrop-dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 grid place-items-center p-5">
            <MotionDialogPanel
              layout
              initial={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.97, y: 10, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 430, damping: 34 }}
              className="w-[min(440px,100%)] rounded-2xl border border-line bg-panel/95 p-4 text-ink shadow-overlay backdrop-blur-[22px] dark:border-line-dark dark:bg-tooltip dark:text-tooltip-ink"
            >
              <div className="flex items-center justify-between">
                <DialogTitle className="text-sm font-semibold">
                  {title}
                </DialogTitle>
                <IconButton onClick={onClose} aria-label="Close">
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={16}
                    color="currentColor"
                  />
                </IconButton>
              </div>
              {children}
            </MotionDialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
