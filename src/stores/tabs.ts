import { create } from "zustand";

/**
 * Open note tabs, in strip order. Intentionally dumb: just the ordered list
 * of rels. Which tab is *active* is derived from `vault.view` — never stored
 * here — so the two can't drift apart.
 */
interface TabsState {
  tabs: string[];
  /** Bumped to ask a note's pane to scroll to top (e.g. opened via a link). */
  scrollTopReq: { rel: string; nonce: number } | null;
  /** Bumped to ask a newly created note to select its title. */
  titleFocusReq: { rel: string; nonce: number } | null;
  /** Add a tab for `rel` if not already open (no-op otherwise). */
  open: (rel: string) => void;
  close: (rel: string) => void;
  /** Rewrite rels after a rename/move of `rel` → `next` (note or folder). */
  remap: (rel: string, next: string) => void;
  /** Drop `rel` and anything under it (folder delete). */
  removeUnder: (rel: string) => void;
  /** Request that `rel`'s pane jump to the top on next render. */
  requestScrollTop: (rel: string) => void;
  /** Request that `rel`'s title input receive focus and select its text. */
  requestTitleFocus: (rel: string) => void;
  clear: () => void;
}

export const useTabs = create<TabsState>((set, get) => ({
  tabs: [],
  scrollTopReq: null,
  titleFocusReq: null,

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

  requestScrollTop: (rel) =>
    set({
      scrollTopReq: { rel, nonce: (get().scrollTopReq?.nonce ?? 0) + 1 },
    }),

  requestTitleFocus: (rel) =>
    set({
      titleFocusReq: {
        rel,
        nonce: (get().titleFocusReq?.nonce ?? 0) + 1,
      },
    }),

  clear: () => set({ tabs: [], scrollTopReq: null, titleFocusReq: null }),
}));

/** Tab to activate after closing `rel`: right neighbor, else left, else none. */
export function nextAfterClose(tabs: string[], rel: string): string | null {
  const index = tabs.indexOf(rel);
  if (index === -1) return tabs[0] ?? null;
  return tabs[index + 1] ?? tabs[index - 1] ?? null;
}
