"use client";

import { ArrowUpRight, Check, Globe2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Grainient } from "@/components/Grainient";
import { MONO_SOFT } from "@/components/grainient-presets";
import { ButtonLink } from "@/components/ui/button";
import { EASE_OUT } from "@/lib/ease";

type Billing = "yearly" | "monthly";

const FEATURES = [
  "Unlimited published sites",
  "Linked pages and hosted images",
  "Private drafts and controlled updates",
  "Cross-device sync when available",
];

export function PricingExperience() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const reduce = useReducedMotion();
  const yearly = billing === "yearly";
  const checkoutUrl = yearly
    ? process.env.NEXT_PUBLIC_MARKD_CLOUD_YEARLY_CHECKOUT_URL
    : process.env.NEXT_PUBLIC_MARKD_CLOUD_MONTHLY_CHECKOUT_URL;

  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: EASE_OUT, delay },
        };

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-32 text-foreground sm:px-8 sm:pt-36">
      <section className="mx-auto max-w-3xl text-center">
        <motion.div {...rise(0)}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-fg-soft shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent-soft text-foreground">
              <Globe2 className="size-3.5" strokeWidth={1.9} />
            </span>
            Markd Cloud
          </span>
        </motion.div>

        <motion.h1
          {...rise(0.06)}
          className="mt-5 text-balance text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[58px]"
        >
          Publish notes that stay
          <br />
          <span className="text-muted-foreground/45">connected.</span>
        </motion.h1>

        <motion.p
          {...rise(0.12)}
          className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-6 text-muted-foreground sm:text-[16px]"
        >
          One subscription for linked pages, hosted images, controlled updates,
          and future cross-device sync.
        </motion.p>

        <motion.div
          {...rise(0.18)}
          className="relative isolate mt-8 overflow-hidden rounded-2xl border border-border bg-card text-left"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-80">
            <Grainient
              className="absolute inset-0"
              {...MONO_SOFT}
              timeSpeed={reduce ? 0 : 0.12}
              warpStrength={0.65}
              warpFrequency={3.6}
              warpSpeed={0.8}
              warpAmplitude={72}
              grainAmount={0.045}
              saturation={0.55}
            />
          </div>

          <div className="flex flex-col gap-5 border-b border-black/[0.07] bg-white/60 p-5 backdrop-blur-[2px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground">
                One plan. Everything included.
              </p>
              <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">
                Markd Cloud
              </h2>
            </div>
            <BillingToggle value={billing} onChange={setBilling} reduceMotion={reduce} />
          </div>

          <div className="flex flex-col gap-6 bg-white/28 p-5 backdrop-blur-[1px] sm:flex-row sm:items-center sm:px-6">
            <div className="sm:w-[190px] sm:shrink-0">
              <div className="flex items-end gap-2">
                <motion.span
                  key={billing}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                  className="text-[44px] font-semibold leading-none tracking-[-0.05em]"
                >
                  {yearly ? "$6" : "$8"}
                </motion.span>
                <span className="pb-1 text-[12px] text-muted-foreground">/ month</span>
              </div>
              <p className="mt-2 text-[11px] text-faint">
                {yearly ? "$72 billed yearly · save 25%" : "Billed monthly"}
              </p>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap gap-x-5 gap-y-2.5">
              {FEATURES.map((item) => (
                <div
                  key={item}
                  className="flex w-full items-center gap-2 text-[12.5px] text-fg-soft sm:w-[calc(50%_-_0.625rem)]"
                >
                  <Check className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-black/[0.07] bg-white/68 px-5 py-4 backdrop-blur-[3px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[12px] font-medium text-foreground">
                Start publishing with Markd Cloud
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                {yearly ? "One yearly payment of $72" : "$8 billed every month"}
              </p>
            </div>
            <ButtonLink
              href={checkoutUrl}
              aria-disabled={!checkoutUrl}
              tabIndex={checkoutUrl ? undefined : -1}
              size="md"
              className={`w-full sm:w-auto ${checkoutUrl ? "" : "pointer-events-none opacity-55"}`}
            >
              Buy {yearly ? "yearly" : "monthly"}
              <ArrowUpRight className="size-[15px]" aria-hidden />
            </ButtonLink>
          </div>
        </motion.div>

        <motion.p
          {...rise(0.24)}
          className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint"
        >
          Local-first · private drafts · publish when ready
        </motion.p>
      </section>
    </main>
  );
}

function BillingToggle({
  value,
  onChange,
  reduceMotion,
}: {
  value: Billing;
  onChange: (value: Billing) => void;
  reduceMotion: boolean | null;
}) {
  return (
    <div
      role="group"
      aria-label="Billing interval"
      className="inline-flex w-fit rounded-full border border-border bg-card p-1"
    >
      {(["yearly", "monthly"] as const).map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option)}
            className={`relative h-7 rounded-full px-3 text-[11.5px] font-medium capitalize transition-colors ${
              selected
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {selected ? (
              <motion.span
                layoutId="billing-selection"
                className="absolute inset-0 rounded-full bg-primary"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 480, damping: 38 }
                }
              />
            ) : null}
            <span className="relative z-10">{option}</span>
          </button>
        );
      })}
    </div>
  );
}
