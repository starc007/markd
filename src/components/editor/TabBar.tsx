import { X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
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
    <div
      role="tablist"
      className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]"
    >
      {tabs.map((rel) => (
        <Tab key={rel} rel={rel} active={rel === active} />
      ))}
    </div>
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

function Tab({ rel, active }: { rel: string; active: boolean }) {
  const setView = useVault((s) => s.setView);

  return (
    <div
      role="tab"
      aria-selected={active}
      title={rel}
      className={cx(
        "group/tab flex h-7 min-w-0 max-w-[180px] shrink-0 cursor-default select-none items-center gap-1 rounded-md pl-2.5 pr-1 text-[12.5px] transition-colors duration-75",
        active
          ? "bg-active text-ink"
          : "text-muted hover:bg-hover hover:text-ink",
      )}
      onClick={() => {
        if (!active) setView({ type: "note", rel });
      }}
      onAuxClick={(event) => {
        // middle-click closes, like every code editor
        if (event.button === 1) closeTab(rel);
      }}
    >
      <span className="truncate">{noteTitle(rel)}</span>
      <Tooltip label="Close ⌘W" side="bottom">
        <button
          type="button"
          aria-label={`Close ${noteTitle(rel)}`}
          className={cx(
            "grid h-4.5 w-4.5 shrink-0 place-items-center rounded transition-opacity duration-75 hover:bg-active",
            active
              ? "opacity-70 hover:opacity-100"
              : "opacity-0 group-hover/tab:opacity-70 group-hover/tab:hover:opacity-100",
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
