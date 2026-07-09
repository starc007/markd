"use client";

import { motion } from "motion/react";
import { FEATURES } from "@/lib/config";

export function Features() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        className="max-w-xl text-[30px] font-semibold tracking-tight text-ink md:text-[38px]"
      >
        A notes app that gets{" "}
        <span className="font-serif font-normal italic text-muted">out of the way.</span>
      </motion.h2>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.55,
              delay: (i % 3) * 0.07,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="group relative bg-bg p-6 transition-colors hover:bg-panel"
          >
            <span className="absolute left-0 top-0 h-[2px] w-0 bg-gradient-to-r from-accent to-accent-2 transition-all duration-300 group-hover:w-full" />
            <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
