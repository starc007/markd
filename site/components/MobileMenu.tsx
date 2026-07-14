"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { GitHubStars } from "./GitHubStars";
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";

type MobileMenuProps = {
  open: boolean;
  links: ReadonlyArray<{ label: string; href: string }>;
  onClose: () => void;
};

export function MobileMenu({ open, links, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    desktop.addEventListener("change", closeOnDesktop);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close navigation menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            onClick={onClose}
            className="pointer-events-auto fixed inset-0 z-10 bg-foreground/[0.04] backdrop-blur-[2px] md:hidden"
          />
          <motion.nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={SPRING_PANEL}
            className="pointer-events-auto fixed inset-x-4 top-20 z-20 overflow-hidden rounded-[1.5rem] border border-border-strong bg-paper/95 p-2 shadow-[0_24px_70px_-28px_rgba(25,25,23,0.35)] backdrop-blur-xl md:hidden"
          >
            <div className="px-1 py-1">
              {links.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: 0.04 + index * 0.025,
                    ease: EASE_OUT,
                  }}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-hover active:bg-active"
                >
                  {link.label}
                  <span className="font-mono text-[10px] tabular-nums text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </motion.a>
              ))}
            </div>
            <div className="border-t border-border px-2 pb-1 pt-3">
              <GitHubStars />
            </div>
          </motion.nav>
        </>
      ) : null}
    </AnimatePresence>
  );
}
