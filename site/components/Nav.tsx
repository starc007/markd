"use client";

import { motion } from "motion/react";
import { Wordmark } from "./Logo";
import { DownloadButton } from "./ui/download-button";
import { GITHUB } from "@/lib/config";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Agent", href: "/#agent" },
  { label: "FAQ", href: "/#faq" },
  { label: "Changelog", href: "/changelog" },
  { label: "GitHub", href: GITHUB },
];

export function Nav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="pointer-events-auto mx-auto flex h-14 w-full max-w-5xl items-center justify-between rounded-full border border-border/50 bg-background/60 px-3 backdrop-blur-xl sm:px-4"
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
        <DownloadButton label="Download" size="sm" />
      </motion.header>
    </div>
  );
}
