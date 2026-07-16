"use client";

import { motion, useReducedMotion } from "motion/react";
import { AppDemo } from "./AppDemo";
import { GitHubIcon } from "./ui/github-icon";
import { ButtonLink } from "./ui/button";
import { DownloadButton } from "./ui/download-button";
import { EASE_OUT } from "@/lib/ease";
import { GITHUB, VERSION } from "@/lib/config";

export function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: EASE_OUT, delay },
        };

  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-0 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-3xl text-center">
        <motion.a
          {...rise(0)}
          href="#agent"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 font-medium text-[13px] text-fg-soft shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-foreground">
            New
          </span>
          An AI that actually reads your notes
        </motion.a>

        <motion.h1
          {...rise(0.06)}
          className="mt-6 text-balance font-semibold text-[44px] leading-[1.02] tracking-[-0.03em] sm:text-[68px]"
        >
          <span className="text-foreground">The last notes app</span>
          <br />
          <span className="text-muted-foreground/45">
            you&apos;ll download.
          </span>
        </motion.h1>

        <motion.p
          {...rise(0.12)}
          className="mx-auto mt-6 max-w-xl text-pretty text-[16px] leading-7 text-muted-foreground sm:text-[18px]"
        >
          Everyone&apos;s built one; most don&apos;t survive their own v2. Markd
          is the fast, local-first markdown editor you actually keep.
          Clean UI, instant everything, and AI that reads and writes your notes.
          Plain{" "}
          <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[0.85em] text-fg-soft">
            .md
          </code>{" "}
          files in a folder you own.
        </motion.p>

        <motion.div
          {...rise(0.18)}
          className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          <DownloadButton size="lg" className="w-full sm:w-auto" />
          <ButtonLink
            href={GITHUB}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            target="_blank"
          >
            <GitHubIcon className="size-[17px]" />
            GitHub
          </ButtonLink>
        </motion.div>

        <motion.p
          {...rise(0.24)}
          className="mt-5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-faint"
        >
          Free &amp; open source · macOS 12+ · Linux x86_64 · v{VERSION}
        </motion.p>
      </div>

      {/* Demo stage — the real app UI, bleeding flush to the bottom. */}
      <div className="mx-auto mt-16 w-full max-w-6xl sm:mt-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-[2rem] border border-b-0 border-border"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/herobg.webp')" }}
          />
          {/* frosted blur frame around the demo */}
          <div className="relative px-5 pt-16 sm:px-32 sm:pt-16">
            <div className="rounded-t-2xl bg-white/25 px-2 pt-2 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-2 sm:pt-2">
              <AppDemo />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
