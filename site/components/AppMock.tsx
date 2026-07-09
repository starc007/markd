"use client";

import { motion, useReducedMotion } from "motion/react";

// The signature Markd window, rebuilt in CSS — sidebar with one inverted active
// row, an editor with a rendered frontmatter panel and a checked task.
export function AppMock() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
      style={{ perspective: 1200 }}
      className="relative"
    >
      {/* accent glow behind the window */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[40px] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, var(--accent-glow), transparent 70%)",
        }}
      />
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_40px_90px_-45px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-line bg-sunken px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-[#f4501e]/80" />
          <span className="h-3 w-3 rounded-full bg-[#f7a616]/80" />
          <span className="h-3 w-3 rounded-full bg-faint/50" />
          <span className="ml-3 font-mono text-[11px] text-faint">markd — vault</span>
        </div>

        <div className="grid grid-cols-[168px_1fr] md:grid-cols-[200px_1fr]">
          {/* sidebar */}
          <aside className="hidden flex-col gap-1 border-r border-line p-3 sm:flex">
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-bg px-2.5 py-1.5 text-[12px] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-faint" /> Search
            </div>
            {["Inbox", "Journal"].map((n) => (
              <div key={n} className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted">
                {n}
              </div>
            ))}
            <div className="rounded-lg bg-invert px-2.5 py-1.5 text-[13px] font-medium text-invert-ink">
              Release notes
            </div>
            {["Reading list", "Ideas", "meeting-2024"].map((n) => (
              <div key={n} className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted">
                {n}
              </div>
            ))}
          </aside>

          {/* editor */}
          <div className="min-h-[320px] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-1.5 font-mono text-[11px] text-faint">
              <span>notes</span>
              <span>/</span>
              <span className="text-muted">release-notes.md</span>
            </div>
            <h3 className="font-serif text-[30px] leading-none text-ink">Release notes</h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {["v0.1.1", "macOS", "shipped"].map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-line bg-bg px-2 py-0.5 font-mono text-[11px] text-muted"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-2.5 w-[92%] rounded bg-line" />
              <div className="h-2.5 w-[78%] rounded bg-line" />
              <div className="h-2.5 w-[85%] rounded bg-line-soft" />
              <div className="mt-5 flex items-center gap-2.5">
                <span className="grid h-4 w-4 place-items-center rounded bg-gradient-to-br from-accent to-accent-2 text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div className="h-2.5 w-[46%] rounded bg-line" />
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded border border-line" />
                <div className="h-2.5 w-[54%] rounded bg-line" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
