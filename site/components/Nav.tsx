"use client";

import { motion } from "motion/react";
import { Wordmark } from "./Logo";
import { DMG, GITHUB } from "@/lib/config";

export function Nav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="sticky top-0 z-40 border-b border-transparent"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="/" aria-label="Markd home">
          <Wordmark size={26} />
        </a>
        <nav className="flex items-center gap-1.5 text-[13px]">
          <a
            href={GITHUB}
            className="rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            GitHub
          </a>
          <a
            href={DMG}
            className="rounded-lg bg-invert px-3.5 py-1.5 font-medium text-invert-ink transition-opacity hover:opacity-90"
          >
            Download
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
