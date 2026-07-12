import { X } from "lucide-react";
import { motion } from "motion/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cx, noteTitle } from "@/lib/utils";
import { nextAfterClose, useTabs } from "@/stores/tabs";
import { useVault } from "@/stores/vault";

/**
 * Code-editor style tab strip for open notes. Active tab is derived from
 * `vault.view`; the strip only owns which tabs exist and their order.
 */
export function TabBar() {
  const tabs = useTabs((s) => s.tabs);
  const view = useVault((s) => s.view);
  const active = view?.type === "note" ? view.rel : null;

  if (tabs.length === 0) return null;

  return (
    // layoutRoot scopes the sliding active-tab fill to this strip so the
    // horizontal scroll offset can't smear its projection.
    <motion.div
      layoutRoot
      role="tablist"
      className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none]"
    >
      {tabs.map((rel, index) => (
        <Tab
          key={rel}
          rel={rel}
          active={rel === active}
          focusable={rel === active || (!active && index === 0)}
        />
      ))}
    </motion.div>
  );
}

/** Close `rel`; if it was the active note, activate its neighbor. */
export function closeTab(rel: string) {
  const { tabs, close } = useTabs.getState();
  const vault = useVault.getState();
  const wasActive = vault.view?.type === "note" && vault.view.rel === rel;
  const next = wasActive ? nextAfterClose(tabs, rel) : null;
  close(rel);
  if (wasActive) {
    vault.setView(next ? { type: "note", rel: next } : null);
  }
}

function Tab({
  rel,
  active,
  focusable,
}: {
  rel: string;
  active: boolean;
  focusable: boolean;
}) {
  const setView = useVault((s) => s.setView);

  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={focusable ? 0 : -1}
      title={rel}
      className={cx(
        "group/tab relative flex h-full min-w-0 max-w-[180px] shrink-0 cursor-pointer select-none items-center gap-1 pl-3 pr-1.5 text-[12.5px] transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink",
        active ? "text-ink" : "text-muted hover:text-ink",
      )}
      onClick={() => {
        if (!active) setView({ type: "note", rel });
      }}
      onAuxClick={(event) => {
        // middle-click closes, like every code editor
        if (event.button === 1) closeTab(rel);
      }}
      onKeyDown={(event) => {
        const tabs = Array.from(
          event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
            '[role="tab"]',
          ) ?? [],
        );
        const index = tabs.indexOf(event.currentTarget);
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") {
          next = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setView({ type: "note", rel });
          return;
        } else return;
        event.preventDefault();
        tabs[next]?.focus();
        tabs[next]?.click();
      }}
    >
      {/* Active fill glides between tabs via shared layout; inactive rows get
          a plain hover tint that doesn't participate in the projection. */}
      {active ? (
        <motion.div
          layoutId="tab-active-fill"
          transition={SPRING_LAYOUT}
          className="absolute inset-0 bg-bg"
        />
      ) : (
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-100 group-hover/tab:bg-hover/60 group-hover/tab:opacity-100" />
      )}
      <span className="relative z-10 truncate">{noteTitle(rel)}</span>
      <Tooltip label="Close ⌘W" side="bottom">
        <button
          type="button"
          aria-label={`Close ${noteTitle(rel)}`}
          className={cx(
            "relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded transition-opacity duration-75 hover:bg-hover",
            active
              ? "opacity-60 hover:opacity-100"
              : "opacity-0 group-hover/tab:opacity-60 group-hover/tab:hover:opacity-100",
          )}
          onClick={(event) => {
            event.stopPropagation();
            closeTab(rel);
          }}
        >
          <X size={11} strokeWidth={2} />
        </button>
      </Tooltip>
    </div>
  );
}
