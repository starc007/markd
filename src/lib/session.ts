import { debounce } from "@/lib/utils";
import { flattenNotes } from "@/lib/tree";
import type { View } from "@/lib/types";
import { useBookmarks } from "@/stores/bookmarks";
import { useTabs } from "@/stores/tabs";
import { useTodos } from "@/stores/todos";
import { useVault } from "@/stores/vault";

/**
 * Per-vault UI session (open tabs, active view, tag filters) persisted to
 * localStorage — the Tauri webview keeps it across restarts. Scoped by vault
 * root so switching vaults restores that vault's own layout.
 */
interface Session {
  tabs: string[];
  view: View | null;
  todoFilter: string | null;
  bookmarkFilter: string | null;
}

const storageKey = (root: string) => `markd:session:${root}`;

function writeSession(root: string) {
  const vault = useVault.getState();
  if (!root || vault.status !== "ready") return;
  const data: Session = {
    tabs: useTabs.getState().tabs,
    view: vault.view,
    todoFilter: useTodos.getState().tagFilter,
    bookmarkFilter: useBookmarks.getState().tagFilter,
  };
  try {
    localStorage.setItem(storageKey(root), JSON.stringify(data));
  } catch {
    // storage full / unavailable — non-fatal, layout just won't persist
  }
}

const saveSession = debounce(() => writeSession(useVault.getState().root), 250);

/** Reapply a vault's saved session. Call once the vault + tree are loaded. */
export function restoreSession(root: string) {
  if (!root) return;
  let data: Session | null = null;
  try {
    const raw = localStorage.getItem(storageKey(root));
    data = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    data = null;
  }
  if (!data) return;

  const vault = useVault.getState();
  const existing = new Set(flattenNotes(vault.tree).map((n) => n.rel));
  // Drop tabs whose notes were deleted since last session.
  const tabs = (data.tabs ?? []).filter((rel) => existing.has(rel));
  useTabs.setState({ tabs });

  useTodos.setState({ tagFilter: data.todoFilter ?? null });
  useBookmarks.setState({ tagFilter: data.bookmarkFilter ?? null });

  const view = data.view;
  if (view?.type === "note") {
    if (existing.has(view.rel)) {
      vault.expandTo(view.rel);
      vault.setView(view);
    } else {
      // Active note gone — fall back to the first surviving tab, else nothing.
      vault.setView(tabs[0] ? { type: "note", rel: tabs[0] } : null);
    }
  } else if (view) {
    vault.setView(view);
  }
}

let started = false;
/** Wire up change → save. Idempotent; safe to call on every mount. */
export function initSessionSync() {
  if (started) return;
  started = true;
  useTabs.subscribe((s, p) => {
    if (s.tabs !== p.tabs) saveSession();
  });
  useVault.subscribe((s, p) => {
    if (s.view !== p.view) saveSession();
  });
  useTodos.subscribe((s, p) => {
    if (s.tagFilter !== p.tagFilter) saveSession();
  });
  useBookmarks.subscribe((s, p) => {
    if (s.tagFilter !== p.tagFilter) saveSession();
  });
  // Flush any pending debounced save before the window goes away.
  window.addEventListener("beforeunload", () => {
    saveSession.cancel();
    writeSession(useVault.getState().root);
  });
}
