"use client";

import { motion, useReducedMotion } from "motion/react";
import { Grainient } from "./Grainient";
import { MONO } from "./grainient-presets";
import { LogoMark } from "./Logo";
import { TextReveal } from "./ui/text-reveal";
import { ButtonLink } from "./ui/button";
import { DownloadButton } from "./ui/download-button";
import { GitHubIcon } from "./ui/github-icon";
import { EASE_OUT } from "@/lib/ease";
import { GITHUB, VERSION } from "@/lib/config";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Agent", href: "/#agent" },
      { label: "Changelog", href: "/changelog" },
      { label: "Releases", href: GITHUB + "/releases" },
    ],
  },
  {
    title: "Source",
    links: [
      { label: "GitHub", href: GITHUB },
      { label: "MIT License", href: GITHUB + "/blob/main/LICENSE" },
      { label: "Contributing", href: GITHUB + "/blob/main/CONTRIBUTING.md" },
    ],
  },
];

export function Footer() {
  const reduce = useReducedMotion();
  return (
    <footer className="w-full px-4 pb-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* CTA panel. */}
        <div className="relative overflow-hidden">
          {/*<Grainient className="absolute inset-0" {...MONO} />*/}
          <div className="relative m-3 rounded-[2rem] px-6 py-16 text-center backdrop-blur-sm sm:px-10 sm:py-20">
            <TextReveal
              as="h2"
              text={["Your notes,", "on your disk."]}
              split="word"
              blur={10}
              whileInView
              className="mx-auto max-w-2xl font-serif text-[36px] leading-[1.02] text-foreground sm:text-[56px]"
            />
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.15 }}
              className="mx-auto mt-5 max-w-md text-pretty text-[15px] leading-7 text-muted-foreground"
            >
              No account, no cloud, no lock-in. Just the last notes app
              you&apos;ll download. Probably. Grab it and start writing.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.22 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <DownloadButton size="lg" />
              <ButtonLink
                href={GITHUB}
                variant="outline"
                size="lg"
                target="_blank"
              >
                <GitHubIcon className="size-[17px]" />
                Star on GitHub
              </ButtonLink>
            </motion.div>
          </div>
        </div>

        {/* Links. */}
        <div className="mt-4 p-8 sm:p-12">
          <div className="flex flex-col justify-between gap-12 md:flex-row">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <LogoMark size={24} />
                <span className="text-[16px] font-semibold tracking-tight text-foreground">
                  Markd
                </span>
              </div>
              <p className="mt-4 text-[13.5px] leading-6 text-muted-foreground">
                Local-first markdown notes for macOS. Your words stay on your
                disk.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 sm:gap-20">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                    {col.title}
                  </p>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-faint sm:flex-row sm:items-center">
            <span>© Markd · v{VERSION}</span>
            <span>Built local-first · Open source</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
