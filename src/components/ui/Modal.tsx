import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
} from "@headlessui/react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const MotionBackdrop = motion.create(DialogBackdrop);
const MotionPanel = motion.create(DialogPanel);

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={onClose}
          className="relative z-50"
        >
          <MotionBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 bg-black/18 backdrop-blur-md"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <MotionPanel
              initial={{ opacity: 0, scale: 0.96, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.97, y: 12, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 430, damping: 34, mass: 0.8 }}
              className={cn(
                "w-full max-w-md flex flex-col rounded-[28px] border border-white/45 bg-card/86 backdrop-blur-2xl shadow-lg dark:border-white/10 dark:bg-card/86",
                title ? "px-6 pb-6" : "p-0",
                className
              )}
            >
              {title && (
                <DialogTitle className="text-lg font-semibold mb-4 pt-6 shrink-0">
                  {title}
                </DialogTitle>
              )}
              <div
                className={cn(
                  title ? "flex-1 min-h-0" : "flex-1 min-h-0 h-full"
                )}
              >
                {children}
              </div>
            </MotionPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn("flex justify-end gap-2 mt-6", className)}>
      {children}
    </div>
  );
}
