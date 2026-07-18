"use client";

import { BookOpen, Check, FileEdit, Link2, ShieldCheck } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Grainient } from "./Grainient";
import { MONO } from "./grainient-presets";
import { EASE_OUT, SPRING_BOUNCE } from "@/lib/ease";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: BookOpen, label: "Read your vault", detail: "42 notes · projects/, journal/" },
  { icon: FileEdit, label: "Drafted the section", detail: "added ## Action items to meeting-2024.md" },
  { icon: Link2, label: "Linked related notes", detail: "[[Roadmap]] · [[Q3 planning]]" },
  { icon: ShieldCheck, label: "Paused for approval", detail: "you review the diff before it lands" },
  { icon: Check, label: "Applied the edit", detail: "saved as plain markdown" },
];

function useReplay(still: boolean, duration: number) {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setCycle((c) => c + 1), duration);
    return () => clearInterval(id);
  }, [still, duration]);
  return cycle;
}

export function AgentTrace() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const still = !!reduce || !inView;
  const cycle = useReplay(still, 6400);

  const rise = (delay = 0) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 20, filter: "blur(6px)" },
          whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.6, ease: EASE_OUT, delay },
        };

  return (
    <section id="agent" className="w-full scroll-mt-24 px-4 py-24 sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.span
            {...rise()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 font-medium text-[12px] text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-accent" /> Coming soon
          </motion.span>
          <motion.h2
            {...rise(0.06)}
            className="mt-6 text-balance font-serif text-[32px] leading-tight text-foreground sm:text-[42px]"
          >
            An agent that works inside your vault, with your hand on every edit.
          </motion.h2>
          <motion.p
            {...rise(0.12)}
            className="mt-5 text-pretty leading-8 text-muted-foreground"
          >
            Ask it to draft, tidy, or connect notes. It reads and writes the same
            plain files you do, narrates each step, and pauses for your approval
            before anything lands. It is planned to use your Claude subscription
            without requiring a separate API key.
          </motion.p>
          <motion.ul {...rise(0.18)} className="mt-7 flex flex-col gap-3">
            {[
              "Reads and writes plain markdown with no hidden format",
              "Every change shown as a diff you approve or edit",
              "Uses your existing subscription with no separate API key",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-[14.5px] leading-6 text-fg-soft">{line}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Animated trace panel. */}
        <motion.div
          {...rise(0.1)}
          ref={ref}
          className="relative overflow-hidden rounded-[2rem] border border-border p-5 sm:p-7"
        >
          <Grainient className="absolute inset-0" {...MONO} />
          <div className="relative rounded-2xl border border-black/[0.06] bg-paper p-4 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-mono text-[12px] font-medium text-fg-soft">
                markd · agent run
              </span>
              <span className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-accent" /> working
              </span>
            </div>
            <motion.div key={cycle} className="mt-4 flex flex-col gap-3.5">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    {...(still
                      ? {}
                      : {
                          initial: { opacity: 0, y: 8 },
                          animate: { opacity: 1, y: 0 },
                          transition: { duration: 0.3, ease: EASE_OUT, delay: 0.2 + i * 0.85 },
                        })}
                    className="flex items-start gap-3"
                  >
                    <motion.span
                      {...(still
                        ? {}
                        : {
                            initial: { scale: 0.5, opacity: 0 },
                            animate: { scale: 1, opacity: 1 },
                            transition: { ...SPRING_BOUNCE, delay: 0.35 + i * 0.85 },
                          })}
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full",
                        i === STEPS.length - 1
                          ? "bg-accent text-white"
                          : "bg-card text-fg-soft ring-1 ring-border",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </motion.span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {step.label}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
