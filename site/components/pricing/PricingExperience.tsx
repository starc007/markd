"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, FileText, Globe2, Image as ImageIcon, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Billing = "yearly" | "monthly";

const FEATURES = [
  {
    icon: FileText,
    title: "Connected pages",
    body: "Publish a note and every linked page as one navigable site.",
    tone: "bg-[oklch(0.95_0.04_255)] text-[oklch(0.45_0.16_255)]",
  },
  {
    icon: ImageIcon,
    title: "Hosted images",
    body: "Images travel with the page and stay fast at every screen size.",
    tone: "bg-[oklch(0.96_0.05_85)] text-[oklch(0.47_0.12_75)]",
  },
  {
    icon: RefreshCw,
    title: "Versioned publishing",
    body: "Edit privately, then choose exactly when the public site updates.",
    tone: "bg-[oklch(0.95_0.04_145)] text-[oklch(0.42_0.12_145)]",
  },
];

export function PricingExperience() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const yearly = billing === "yearly";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 pb-24 pt-36 text-foreground sm:px-6 sm:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] opacity-80 [background:radial-gradient(circle_at_16%_20%,oklch(0.9_0.1_255/.65),transparent_32%),radial-gradient(circle_at_82%_12%,oklch(0.92_0.1_90/.6),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_58%)]"
      />

      <section className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.72_0.12_255/.35)] bg-[oklch(0.97_0.025_255/.8)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-[oklch(0.43_0.16_255)] backdrop-blur">
            <Globe2 className="size-3.5" />
            Markd Cloud
          </span>
          <h1 className="mt-7 font-serif text-[46px] font-medium leading-[0.98] tracking-[-0.045em] sm:text-[72px]">
            Give your notes
            <br />
            <span className="text-[oklch(0.48_0.18_255)]">a front door.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
            Turn one note and everything it links to into a calm, connected website.
            Your drafts stay local until you decide to publish.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[28px] border border-[oklch(0.48_0.18_255/.25)] bg-paper shadow-[0_30px_90px_oklch(0.45_0.15_255/.12)]"
        >
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-9 lg:p-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[oklch(0.46_0.16_255)]">
                    One plan. Everything included.
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                    Markd Cloud
                  </h2>
                </div>
                <BillingToggle value={billing} onChange={setBilling} />
              </div>

              <div className="mt-9 flex items-end gap-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={billing}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="text-[52px] font-semibold leading-none tracking-[-0.055em]"
                  >
                    {yearly ? "$6" : "$8"}
                  </motion.span>
                </AnimatePresence>
                <span className="pb-1 text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="mt-2 text-[12px] text-faint">
                {yearly ? "$72 billed once a year" : "Billed monthly"}
              </p>

              <div className="mt-8 space-y-3">
                {["Unlimited published sites", "Linked pages and hosted images", "Private drafts and controlled updates", "Cross-device sync when available"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-[13.5px] text-fg-soft">
                    <span className="grid size-5 place-items-center rounded-full bg-[oklch(0.93_0.08_145)] text-[oklch(0.4_0.13_145)]">
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/download"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[oklch(0.45_0.18_255)] px-5 text-[14px] font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5"
                >
                  Download Markd
                  <ArrowRight className="size-4" />
                </Link>
                <p className="text-[11.5px] leading-5 text-faint">
                  Cloud checkout is opening soon.
                </p>
              </div>
            </div>

            <aside className="relative overflow-hidden bg-[oklch(0.45_0.18_255)] p-7 text-white sm:p-9 lg:p-10">
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 size-64 rounded-full bg-[oklch(0.86_0.16_90)] opacity-90 blur-sm"
              />
              <div className="relative flex h-full min-h-[310px] flex-col">
                <span className="w-fit rounded-full bg-[oklch(0.9_0.16_95)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[oklch(0.32_0.08_75)]">
                  {yearly ? "Save 25%" : "Cancel any month"}
                </span>
                <blockquote className="mt-auto font-serif text-[30px] leading-[1.12] tracking-[-0.025em]">
                  “The web version should feel like the note—not a different product.”
                </blockquote>
                <p className="mt-5 text-[12px] leading-5 text-white/65">
                  Published pages inherit Markd’s typography, system theme, and connected-note navigation.
                </p>
              </div>
            </aside>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, tone }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + index * 0.06, duration: 0.45 }}
              className="rounded-2xl border border-border bg-paper/80 p-5 backdrop-blur"
            >
              <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-4" />
              </span>
              <h3 className="mt-5 text-[14px] font-semibold">{title}</h3>
              <p className="mt-2 text-[12.5px] leading-5 text-muted-foreground">{body}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}

function BillingToggle({
  value,
  onChange,
}: {
  value: Billing;
  onChange: (value: Billing) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Billing interval"
      className="inline-flex rounded-xl bg-panel p-1"
    >
      {(["yearly", "monthly"] as const).map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option)}
            className={`relative h-8 rounded-lg px-3 text-[11.5px] font-semibold capitalize transition-colors ${
              selected ? "text-foreground" : "text-faint hover:text-foreground"
            }`}
          >
            {selected ? (
              <motion.span
                layoutId="billing-selection"
                className="absolute inset-0 rounded-lg border border-border bg-paper shadow-sm"
                transition={{ type: "spring", stiffness: 480, damping: 38 }}
              />
            ) : null}
            <span className="relative">{option}</span>
          </button>
        );
      })}
    </div>
  );
}
