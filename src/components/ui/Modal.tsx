import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { cx } from "@/lib/utils";

type Align = "center" | "top";

/**
 * Backdrop + animated panel. Handles Escape, click-outside, and enter/exit
 * motion. For a trigger-anchored "morph" effect, pass a shared `layoutId`
 * to both the trigger and this panel (motion animates the shared layout).
 */
export function Modal({
  open,
  onClose,
  children,
  align = "center",
  className,
  layoutId,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: Align;
  className?: string;
  layoutId?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={cx(
            "fixed inset-0 z-80 flex justify-center bg-black/20 dark:bg-black/45",
            align === "center" ? "items-center" : "items-start",
          )}
          onMouseDown={onClose}
        >
          <motion.div
            layoutId={layoutId}
            initial={{ opacity: 0, scale: 0.985, y: align === "top" ? -6 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: align === "top" ? -6 : 6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cx(
              "max-w-[calc(100vw-48px)] overflow-hidden rounded-xl border border-line bg-bg shadow-2xl shadow-black/20 dark:shadow-black/60",
              className,
            )}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
