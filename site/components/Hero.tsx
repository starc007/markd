"use client";

import { motion, type Variants } from "motion/react";
import { DownloadButton } from "./DownloadButton";
import { AppMock } from "./AppMock";
import { VERSION } from "@/lib/config";

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-14 md:pt-20">
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.p
          variants={item}
          className="font-mono text-[12px] uppercase tracking-[0.2em] text-faint"
        >
          Local-first markdown · macOS
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-5 max-w-3xl text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink md:text-[64px]"
        >
          Notes that live in{" "}
          <span className="accent-text font-serif font-normal italic">your</span>{" "}
          folder.
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted md:text-[18px]"
        >
          Markd is a fast, monochrome markdown editor for macOS. Plain{" "}
          <code className="font-mono text-[0.9em] text-ink">.md</code> files in a
          folder you own — portable, offline, yours.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <DownloadButton />
          <div className="text-[13px] leading-tight text-muted">
            <div>Free · Apple Silicon</div>
            <div className="text-faint">Version {VERSION} · macOS 12+</div>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-16 md:mt-20">
        <AppMock />
      </div>
    </section>
  );
}
