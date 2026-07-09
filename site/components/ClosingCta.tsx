"use client";

import { motion } from "motion/react";
import { DownloadButton } from "./DownloadButton";

export function ClosingCta() {
  return (
    <section className="relative mx-auto max-w-5xl overflow-hidden px-6 py-24 text-center md:py-32">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 40%, var(--accent-glow), transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink md:text-[44px]">
          Your notes, on{" "}
          <span className="accent-text font-serif font-normal italic">your</span> disk.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">
          No account. No cloud. No subscription. Download it and start writing.
        </p>
        <div className="mt-9 flex justify-center">
          <DownloadButton />
        </div>
      </motion.div>
    </section>
  );
}
