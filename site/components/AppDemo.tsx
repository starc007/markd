"use client";

import {
  Bookmark,
  CheckSquare,
  ChevronRight,
  Circle,
  Copy,
  Download,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type View = "note" | "todos" | "bookmarks";
const VIEWS: View[] = ["note", "todos", "bookmarks"];

/* ── Sidebar ─────────────────────────────────────────────────────────── */

type Node = { label: string; depth: number; kind: "folder" | "file"; open?: boolean; active?: boolean };
const TREE: Node[] = [
  { label: "Projects", depth: 0, kind: "folder", open: true },
  { label: "Q3 Roadmap", depth: 1, kind: "file", active: true },
  { label: "App architecture", depth: 1, kind: "file" },
  { label: "Journal", depth: 0, kind: "folder" },
  { label: "Reading list", depth: 0, kind: "file" },
  { label: "Release notes", depth: 0, kind: "file" },
];

function TreeRow({ node, dimmed }: { node: Node; dimmed: boolean }) {
  const Icon = node.kind === "folder" ? (node.open ? FolderOpen : Folder) : FileText;
  const active = node.active && !dimmed;
  return (
    <div
      className={cn(
        "flex h-[30px] items-center rounded-md pr-1.5 text-[13px] transition-colors",
        active ? "bg-active text-foreground" : "text-muted-foreground",
      )}
      style={{ paddingLeft: 8 + node.depth * 15 }}
    >
      <Icon
        size={14}
        strokeWidth={1.75}
        className={cn("mr-2 shrink-0", active ? "text-foreground" : "text-faint")}
      />
      <span className={cn("truncate", node.kind === "folder" && "font-medium")}>{node.label}</span>
    </div>
  );
}

function Sidebar({ view }: { view: View }) {
  const pages: { icon: typeof CheckSquare; label: string; v: View }[] = [
    { icon: CheckSquare, label: "Todos", v: "todos" },
    { icon: Bookmark, label: "Bookmarks", v: "bookmarks" },
  ];
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-line-soft bg-panel sm:flex">
      <div className="flex items-center px-4 pb-2 pt-4">
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
          My Notes
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2 pb-1">
        {pages.map(({ icon: Icon, label, v }) => {
          const active = view === v;
          return (
            <div
              key={label}
              className={cn(
                "flex h-[30px] items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
                active ? "bg-active text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon size={15} strokeWidth={1.75} />
              <span className="font-medium">{label}</span>
            </div>
          );
        })}
      </nav>
      <div className="mx-4 my-2 border-t border-line-soft" />
      <div className="flex items-center justify-between pb-1 pl-4 pr-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Notes</span>
        <div className="flex items-center gap-0.5 text-faint">
          <FilePlus size={14.5} strokeWidth={1.75} />
          <FolderPlus size={14.5} strokeWidth={1.75} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-2 pt-1">
        {TREE.map((n) => (
          <TreeRow key={n.label} node={n} dimmed={view !== "note"} />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-line-soft px-3 py-2 text-faint">
        <Settings size={15} strokeWidth={1.75} />
      </div>
    </aside>
  );
}

/* ── Top rows ────────────────────────────────────────────────────────── */

const TABS = ["Q3 Roadmap", "Release notes", "App architecture"];

function Tabs() {
  return (
    <div className="flex h-11 shrink-0 items-stretch gap-1.5 bg-sunken pl-2.5 pr-3">
      <div className="flex shrink-0 items-center">
        <span className="grid h-7 w-7 place-items-center rounded-md text-faint">
          <PanelLeft size={15.5} strokeWidth={1.75} />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-stretch overflow-hidden">
        {TABS.map((t, i) => (
          <div
            key={t}
            className={cn(
              "relative flex h-full min-w-0 max-w-[180px] shrink-0 items-center gap-1 pl-3 pr-1.5 text-[12.5px]",
              i === 0 ? "bg-background text-foreground" : "text-muted-foreground",
            )}
          >
            <span className="relative z-10 truncate">{t}</span>
            <span className={cn("relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded", i === 0 ? "opacity-60" : "opacity-0")}>
              <X size={11} strokeWidth={2} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pill({ icon: Icon, children }: { icon: typeof Copy; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 select-none items-center gap-1.5 rounded-md border border-border bg-hover px-2.5 text-[12.5px] font-medium text-foreground">
      <Icon size={12.5} strokeWidth={2} />
      {children}
    </span>
  );
}

function TopRow({ view }: { view: View }) {
  return (
    <div className="flex h-10 shrink-0 items-center px-3">
      <div className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
        {view === "note" ? (
          <>
            <span className="shrink-0 truncate text-muted-foreground">Projects</span>
            <ChevronRight size={13} strokeWidth={2} className="shrink-0 text-faint" />
            <span className="shrink-0 font-semibold text-foreground">Q3 Roadmap</span>
          </>
        ) : (
          <span className="shrink-0 font-semibold text-foreground">
            {view === "todos" ? "Todos" : "Bookmarks"}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {view === "note" && <Pill icon={Copy}>Copy path</Pill>}
        {view === "bookmarks" && <Pill icon={Download}>Export</Pill>}
        {view !== "note" && <Pill icon={Tag}>New tag</Pill>}
      </div>
    </div>
  );
}

/* ── Panes ───────────────────────────────────────────────────────────── */

function Properties() {
  const rows: { k: string; v: React.ReactNode }[] = [
    { k: "Status", v: <span className="text-foreground">Shipping</span> },
    {
      k: "Tags",
      v: (
        <div className="flex flex-wrap gap-1">
          {["planning", "q3"].map((t) => (
            <span key={t} className="rounded-full bg-hover px-2 py-0.5 text-[11.5px] leading-none text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    { k: "Updated", v: <span className="text-foreground">2024-07-08</span> },
  ];
  return (
    <div className="mb-5 mt-1 border-b border-border pb-3">
      <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        <ChevronRight size={12} strokeWidth={2.5} className="rotate-90" />
        Properties
      </div>
      <div className="flex flex-col gap-0.5 pt-1">
        {rows.map((r) => (
          <div key={r.k} className="flex items-start gap-3 py-0.5 text-[12.5px]">
            <span className="w-24 shrink-0 truncate capitalize text-faint">{r.k}</span>
            <div className="min-w-0 flex-1">{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotePane({ still }: { still: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[620px] px-8 pt-6 sm:px-10">
      <Properties />
      <h1 className="text-[30px] font-[680] tracking-[-0.025em] text-foreground">Q3 Roadmap</h1>
      <div className="mt-4 space-y-4 text-[15px] leading-[1.75] text-foreground/85">
        <p>
          The quarter is about speed and focus — ship the editor rewrite, then open
          up the workflow to an in-app agent.
        </p>
        <h2 className="pt-1 text-[19px] font-semibold tracking-[-0.01em] text-foreground">Milestones</h2>
        <ul className="space-y-2">
          {[
            { done: true, text: "Persistent editor — instant note switching" },
            { done: false, text: "Agent panel with review-before-apply" },
            { done: false, text: "Optional end-to-end sync" },
          ].map((t) => (
            <li key={t.text} className="flex items-center gap-2.5">
              <span className={cn("grid size-[18px] shrink-0 place-items-center rounded border", t.done ? "border-foreground bg-foreground text-background" : "border-border-strong")}>
                {t.done ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </span>
              <span className={cn(t.done && "text-muted-foreground line-through decoration-faint")}>{t.text}</span>
            </li>
          ))}
        </ul>
        <p>
          Details live in the{" "}
          <span className="cursor-text text-foreground underline decoration-border underline-offset-2">Release notes</span>.
          See also the app architecture
          {still ? null : (
            <motion.span
              aria-hidden
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-foreground align-middle"
            />
          )}
        </p>
      </div>
    </div>
  );
}

/* Left filter rail — "Tags" with an active (filtered) pill. Monochrome, but
   each tag gets its own ink shade so the dots read as distinct swatches. */
const TAG_SHADES = ["bg-foreground/85", "bg-foreground/60", "bg-foreground/40", "bg-foreground/70", "bg-foreground/50"];

function TagRail({ tags, active }: { tags: string[]; active: string | null }) {
  const Row = ({ label, on, dot }: { label: string; on: boolean; dot?: string }) => (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
        on ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {on && <span className="absolute inset-0 rounded-md bg-active" />}
      <span
        className={cn(
          "relative z-10 size-2 shrink-0 rounded-full",
          dot ?? "border border-faint",
        )}
      />
      <span className="relative z-10 truncate">{label}</span>
    </div>
  );
  return (
    <aside className="hidden w-[148px] shrink-0 sm:block">
      <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        Tags
      </p>
      <div className="flex flex-col gap-0.5">
        <Row label="All" on={active === null} />
        {tags.map((t, i) => (
          <Row key={t} label={t} on={active === t} dot={TAG_SHADES[i % TAG_SHADES.length]} />
        ))}
      </div>
    </aside>
  );
}

const TODO_TAGS = ["work", "personal", "markd"];
const TODOS = [
  { done: false, text: "Reply to design feedback", tag: "work" },
  { done: false, text: "Book flights for the offsite", tag: "personal" },
  { done: true, text: "Ship v0.1.1 to the updater", tag: "markd" },
  { done: false, text: "Draft the Q3 roadmap", tag: "markd" },
  { done: false, text: "Review agent ACP notes", tag: "markd" },
];

function TodosPane() {
  const active = "markd";
  const rows = TODOS.filter((t) => t.tag === active);
  const open = rows.filter((r) => !r.done).length;
  return (
    <div className="mx-auto flex w-full max-w-[760px] gap-8 px-8 pt-6 sm:px-10">
      <TagRail tags={TODO_TAGS} active={active} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-muted-foreground">
          {open} open · {rows.length - open} done ·{" "}
          <span className="text-foreground">#{active}</span>
        </p>
        <div className="mt-4 flex items-center gap-2.5 border-b border-border pb-3">
          <Plus size={16} strokeWidth={2} className="shrink-0 text-faint" />
          <span className="text-[14.5px] text-faint">Add a task…</span>
        </div>
        <div className="mt-3 flex flex-col">
          {rows.map((t) => (
            <div key={t.text} className="flex items-start gap-2.5 rounded-md px-1 py-[7px]">
              <div className="flex h-6 shrink-0 items-center">
                {t.done ? (
                  <span className="grid size-[17px] place-items-center rounded-full bg-foreground text-background">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <Circle size={17} strokeWidth={1.75} className="text-border-strong" />
                )}
              </div>
              <span className={cn("text-[14.5px] leading-6", t.done ? "text-muted-foreground line-through decoration-faint" : "text-foreground")}>
                {t.text}
              </span>
              <span className="ml-auto shrink-0 rounded-full bg-hover px-2 py-0.5 text-[11px] leading-5 text-muted-foreground">
                {t.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BOOKMARK_TAGS = ["reading", "dev", "agents"];
const BOOKMARKS = [
  { title: "Local-first software", host: "inkandswitch.com", tag: "reading" },
  { title: "Designing calm software", host: "calmtech.com", tag: "reading" },
  { title: "Tauri 2.0 — a new era", host: "tauri.app", tag: "dev" },
  { title: "The Agent Client Protocol", host: "agentclientprotocol.com", tag: "agents" },
];

function BookmarksPane() {
  const active = "reading";
  const rows = BOOKMARKS.filter((b) => b.tag === active);
  return (
    <div className="mx-auto flex w-full max-w-[760px] gap-8 px-8 pt-6 sm:px-10">
      <TagRail tags={BOOKMARK_TAGS} active={active} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-muted-foreground">
          {rows.length} saved · <span className="text-foreground">#{active}</span>
        </p>
        <div className="mt-4 flex items-center gap-2.5 border-b border-border pb-3">
          <Search size={15} strokeWidth={2} className="shrink-0 text-faint" />
          <span className="text-[14.5px] text-faint">Add a link…</span>
        </div>
        <div className="mt-3 flex flex-col gap-0.5">
          {rows.map((b) => (
            <div key={b.title} className="flex items-start gap-3 rounded-lg px-2 py-2">
              <div className="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-line-soft bg-hover text-faint">
                <Globe size={16} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-foreground">{b.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-faint">{b.host}</p>
                <span className="mt-1.5 inline-block rounded-full bg-hover px-2 py-0.5 text-[11px] leading-5 text-muted-foreground">
                  {b.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Window ──────────────────────────────────────────────────────────── */

export function AppDemo() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [view, setView] = useState<View>("note");

  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => {
      setView((v) => VIEWS[(VIEWS.indexOf(v) + 1) % VIEWS.length]);
    }, 3400);
    return () => clearInterval(id);
  }, [reduce, inView]);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-t-xl border border-b-0 border-border-strong bg-background shadow-[0_40px_90px_-50px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center gap-2 border-b border-border bg-sunken px-4 py-3">
        <span className="size-3 rounded-full bg-black/20" />
        <span className="size-3 rounded-full bg-black/12" />
        <span className="size-3 rounded-full bg-black/[0.08]" />
      </div>
      <div className="flex h-[520px]">
        <Sidebar view={view} />
        <main className="flex min-w-0 flex-1 flex-col">
          <Tabs />
          <TopRow view={view} />
          <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="h-full"
              >
                {view === "note" && <NotePane still={!!reduce} />}
                {view === "todos" && <TodosPane />}
                {view === "bookmarks" && <BookmarksPane />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
