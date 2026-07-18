"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Wordmark } from "./Logo";
import { DownloadButton } from "./ui/download-button";
import { GitHubStars } from "./GitHubStars";
import { MobileMenu } from "./MobileMenu";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Agent", href: "/#agent" },
  { label: "FAQ", href: "/#faq" },
  { label: "Changelog", href: "/changelog" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="pointer-events-auto relative z-30 mx-auto flex h-14 w-full max-w-5xl items-center justify-between rounded-full border border-border/50 bg-background/60 px-3 backdrop-blur-xl sm:px-4"
      >
        <a href="/" aria-label="Markd home" className="px-1">
          <Wordmark size={22} />
        </a>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <GitHubStars />
          </div>
          <DownloadButton label="Download" size="sm" />
          <button
            type="button"
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
            className="relative grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-hover md:hidden"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={mobileOpen ? "close" : "menu"}
                initial={{
                  opacity: 0,
                  rotate: mobileOpen ? -45 : 45,
                  scale: 0.7,
                }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  rotate: mobileOpen ? 45 : -45,
                  scale: 0.7,
                }}
                transition={{ duration: 0.13, ease: "easeOut" }}
                className="absolute"
              >
                {mobileOpen ? (
                  <X className="size-[18px]" strokeWidth={1.9} />
                ) : (
                  <Menu className="size-[18px]" strokeWidth={1.9} />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </motion.header>
      <MobileMenu
        open={mobileOpen}
        links={LINKS}
        onClose={closeMobileMenu}
      />
    </div>
  );
}
