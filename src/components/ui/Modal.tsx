import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";

type Align = "center" | "top";

/**
 * Backdrop + spring-entered panel, sharing beui's motion tokens so our own
 * dialogs and any component pulled from the beui registry feel identical.
 * Handles Escape and click-outside. Pass a shared `layoutId` to both a trigger
 * and this panel for a morph-open effect.
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
  const reduce = useReducedMotion();
  const enterY = reduce ? 0 : align === "top" ? -10 : 10;

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
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className={cn(
            "fixed inset-0 z-80 flex justify-center bg-background/5 backdrop-blur-sm",
            align === "center" ? "items-center" : "items-start",
          )}
          onMouseDown={onClose}
        >
          <motion.div
            layoutId={layoutId}
            initial={{ opacity: 0, y: enterY, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: enterY * 0.6,
              scale: reduce ? 1 : 0.96,
              transition: { duration: 0.14, ease: EASE_OUT },
            }}
            transition={SPRING_PANEL}
            className={cn(
              "relative max-w-[calc(100vw-48px)] overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/20 will-change-transform dark:shadow-black/60",
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
