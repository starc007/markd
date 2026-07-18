"use client";

import { Check, FileText, Folder, Search } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Grainient } from "./Grainient";
import { type GrainientPreset, MONO, MONO_SOFT } from "./grainient-presets";
import { TextReveal } from "./ui/text-reveal";
import { EASE_OUT, SPRING_BOUNCE } from "@/lib/ease";
import { cn } from "@/lib/utils";

function useReplay(still: boolean, duration: number) {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setCycle((c) => c + 1), duration);
    return () => clearInterval(id);
  }, [still, duration]);
  return cycle;
}

function Stage({
  h,
  preset = MONO,
  children,
}: {
  h: string;
  preset?: GrainientPreset;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", h)}>
      <Grainient className="absolute inset-0" {...preset} />
      <div className="absolute inset-0 flex items-center justify-center p-5">
        {children}
      </div>
    </div>
  );
}

const CARD = "w-full rounded-2xl border border-black/[0.06] bg-paper shadow-[0_24px_50px_-28px_rgba(0,0,0,0.5)]";

/* ── Command palette (featured) ─────────────────────────────────────── */

const PAL = [
  { t: "Q3 Roadmap", s: "projects/roadmap.md" },
  { t: "Release notes", s: "release-notes.md" },
  { t: "Reading list", s: "reading-list.md" },
  { t: "Meeting: planning", s: "journal/2024.md" },
];

function PaletteCell({ still }: { still: boolean }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setActive((a) => (a + 1) % PAL.length), 1300);
    return () => clearInterval(id);
  }, [still]);
  return (
    <Stage h="h-[24rem]">
      <div className={cn(CARD, "max-w-sm overflow-hidden")}>
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="size-3.5 text-faint" />
          <span className="text-[13px] text-muted-foreground">Jump to anything…</span>
          <span className="ml-auto rounded border border-border-strong bg-card px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
            ⌘K
          </span>
        </div>
        <div className="p-1.5">
          {PAL.map((r, i) => (
            <div key={r.t} className="relative flex items-center justify-between px-3 py-2 text-[13px]">
              {i === active ? (
                <motion.span
                  layoutId="bento-palette"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              ) : null}
              <span className={cn("relative z-10 font-medium", i === active ? "text-primary-foreground" : "text-fg-soft")}>
                {r.t}
              </span>
              <span className={cn("relative z-10 font-mono text-[10.5px]", i === active ? "text-primary-foreground/60" : "text-faint")}>
                {r.s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ── Plain files (tree) ─────────────────────────────────────────────── */

const TREE = [
  { d: 0, label: "projects", folder: true },
  { d: 1, label: "roadmap.md" },
  { d: 1, label: "app.md" },
  { d: 0, label: "journal", folder: true },
  { d: 0, label: "reading-list.md" },
];

function FilesCell() {
  return (
    <Stage h="h-[24rem]" preset={MONO_SOFT}>
      <div className={cn(CARD, "max-w-[15rem] overflow-hidden")}>
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
          <span className="size-1.5 rounded-sm bg-accent" /> ~/Notes
        </div>
        <div className="p-2">
          {TREE.map((r) => (
            <div
              key={r.label}
              style={{ paddingLeft: 10 + r.d * 16 }}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-fg-soft"
            >
              {r.folder ? <Folder className="size-3.5 text-faint" /> : <FileText className="size-3.5 text-faint" />}
              <span className={r.folder ? "font-medium" : ""}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ── Wiki links (scrolling recall) ──────────────────────────────────── */

const LINKS = ["[[Roadmap]]", "[[Q3 planning]]", "[[Release notes]]", "[[Ideas]]", "[[Reading list]]"];

function LinksCell({ still }: { still: boolean }) {
  const rows = [...LINKS, ...LINKS];
  const Row = ({ text }: { text: string }) => (
    <div className={cn(CARD, "mb-1.5 flex items-center gap-2 px-3 py-2")}>
      <span className="size-1.5 rounded-full bg-accent" />
      <span className="truncate font-mono text-[12px] text-accent">{text}</span>
    </div>
  );
  return (
    <Stage h="h-[13rem]">
      {still ? (
        <div className="w-full">
          {LINKS.slice(0, 3).map((m) => (
            <Row key={m} text={m} />
          ))}
        </div>
      ) : (
        <div className="h-[9rem] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
          <motion.div
            animate={{ y: ["0%", "-50%"] }}
            transition={{ duration: LINKS.length * 1.8, ease: "linear", repeat: Infinity }}
          >
            {rows.map((m, i) => (
              <Row key={`${m}-${i}`} text={m} />
            ))}
          </motion.div>
        </div>
      )}
    </Stage>
  );
}

/* ── Frontmatter (properties build) ─────────────────────────────────── */

const YAML = [
  { k: "title", v: "Q3 Roadmap" },
  { k: "tags", v: "planning, q3" },
  { k: "status", v: "shipping" },
];

function FrontmatterCell({ still }: { still: boolean }) {
  const cycle = useReplay(still, 3400);
  return (
    <Stage h="h-[13rem]" preset={MONO_SOFT}>
      <div className={cn(CARD, "max-w-[15rem] p-3.5")}>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">Properties</p>
        <motion.div key={cycle} className="mt-2 space-y-1.5">
          {YAML.map((f, i) => (
            <motion.div
              key={f.k}
              {...(still
                ? {}
                : {
                    initial: { opacity: 0, y: 4 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.28, ease: EASE_OUT, delay: 0.2 + i * 0.4 },
                  })}
              className="flex items-center gap-2 text-[12px]"
            >
              <span className="w-14 shrink-0 font-mono text-muted-foreground">{f.k}</span>
              <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-accent">{f.v}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Stage>
  );
}

/* ── Instant search (ranked hits) ───────────────────────────────────── */

function SearchCell({ still }: { still: boolean }) {
  const cycle = useReplay(still, 3200);
  return (
    <Stage h="h-[13rem]">
      <div className={cn(CARD, "max-w-[15rem] p-3.5")}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
          <Search className="size-3.5 text-faint" />
          <span className="font-mono text-[12px] text-fg-soft">mark</span>
          <motion.span
            aria-hidden
            animate={still ? undefined : { opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-3.5 w-px bg-accent"
          />
        </div>
        <motion.div key={cycle} className="mt-2.5 space-y-1.5">
          {[
            { t: "book", hit: "mark", t2: "s", tag: "title" },
            { t: "exported all ", hit: "mark", t2: "down", tag: "body" },
          ].map((r, i) => (
            <motion.div
              key={r.tag}
              {...(still
                ? {}
                : {
                    initial: { opacity: 0, y: 4 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.28, ease: EASE_OUT, delay: 0.2 + i * 0.35 },
                  })}
              className="flex items-center gap-2 text-[12px] text-fg-soft"
            >
              <span className="truncate">
                {r.t}
                <span className="bg-accent-soft text-accent">{r.hit}</span>
                {r.t2}
              </span>
              <span className="ml-auto font-mono text-[9.5px] uppercase tracking-wide text-faint">{r.tag}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Stage>
  );
}

/* ── Grid ───────────────────────────────────────────────────────────── */

function Cell({
  children,
  className,
  index,
  reduce,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(6px)" }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={reduce ? undefined : { duration: 0.5, ease: EASE_OUT, delay: Math.min(index * 0.08, 0.32) }}
      className={cn("flex flex-col overflow-hidden rounded-3xl border border-border p-3", className)}
    >
      {children}
    </motion.div>
  );
}

function Caption({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-3 shrink-0 px-1 pb-1">
      <h3 className="font-medium text-[17px] text-foreground">{title}</h3>
      <p className="mt-1 text-pretty text-[13.5px] leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

export function FeaturesBento() {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { margin: "-15% 0px" });
  const still = !!reduce || !inView;

  return (
    <section id="features" className="w-full scroll-mt-24 px-4 py-24 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 font-medium text-[12px] text-muted-foreground">
            Everything you need
          </span>
          <TextReveal
            as="h2"
            text={["A calm place to write,", "built for speed."]}
            split="word"
            blur={10}
            whileInView
            className="mt-5 text-balance font-serif text-[32px] leading-[1.1] text-foreground sm:text-[42px]"
          />
          <p className="mt-4 max-w-xl text-pretty text-[14.5px] leading-7 text-muted-foreground">
            The things other apps ship in v3, including real search, page links, a
            command palette, and honest markdown, are here on day one and out of your way.
          </p>
        </div>

        <div ref={gridRef} className="mt-12 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Cell reduce={reduce} index={0} className="sm:col-span-2 lg:col-span-4">
            <PaletteCell still={still} />
            <Caption title="Everything, one keystroke away" body="Press ⌘K to jump to any note or run any action, ranked in milliseconds and keyboard all the way." />
          </Cell>
          <Cell reduce={reduce} index={1} className="sm:col-span-2 lg:col-span-2">
            <FilesCell />
            <Caption title="Plain files, real folders" body="Every note is a .md file in a folder you own. Open it in Finder, sync with iCloud, version with git." />
          </Cell>
          <Cell reduce={reduce} index={2} className="lg:col-span-2">
            <LinksCell still={still} />
            <Caption title="Link ideas together" body="Type [[ to connect notes, stored as clean markdown with backlinks." />
          </Cell>
          <Cell reduce={reduce} index={3} className="lg:col-span-2">
            <FrontmatterCell still={still} />
            <Caption title="Frontmatter, rendered" body="YAML from any tool is preserved and shown as a tidy properties panel." />
          </Cell>
          <Cell reduce={reduce} index={4} className="lg:col-span-2">
            <SearchCell still={still} />
            <Caption title="Find it instantly" body="Title and content search is ranked so the note you meant surfaces first." />
          </Cell>
        </div>
      </div>
    </section>
  );
}
