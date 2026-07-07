import { create } from "zustand";

/**
 * Open note tabs, in strip order. Intentionally dumb: just the ordered list
 * of rels. Which tab is *active* is derived from `vault.view` — never stored
 * here — so the two can't drift apart.
 */
interface TabsState {
  tabs: string[];
  /** Add a tab for `rel` if not already open (no-op otherwise). */
  open: (rel: string) => void;
  close: (rel: string) => void;
  /** Rewrite rels after a rename/move of `rel` → `next` (note or folder). */
  remap: (rel: string, next: string) => void;
  /** Drop `rel` and anything under it (folder delete). */
  removeUnder: (rel: string) => void;
  clear: () => void;
}

export const useTabs = create<TabsState>((set, get) => ({
  tabs: [],

  open: (rel) => {
    if (!get().tabs.includes(rel)) set({ tabs: [...get().tabs, rel] });
  },

  close: (rel) => set({ tabs: get().tabs.filter((t) => t !== rel) }),

  remap: (rel, next) =>
    set({
      tabs: get().tabs.map((t) =>
        t === rel ? next : t.startsWith(`${rel}/`) ? next + t.slice(rel.length) : t,
      ),
    }),

  removeUnder: (rel) =>
    set({
      tabs: get().tabs.filter((t) => t !== rel && !t.startsWith(`${rel}/`)),
    }),

  clear: () => set({ tabs: [] }),
}));

/** Tab to activate after closing `rel`: right neighbor, else left, else none. */
export function nextAfterClose(tabs: string[], rel: string): string | null {
  const index = tabs.indexOf(rel);
  if (index === -1) return tabs[0] ?? null;
  return tabs[index + 1] ?? tabs[index - 1] ?? null;
}
