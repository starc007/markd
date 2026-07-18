import { create } from "zustand";
import {
  defaultShortcutBindings,
  isValidShortcut,
  normalizeShortcut,
  shortcutStorageKey,
  type ShortcutAction,
  type ShortcutBinding,
} from "@/lib/shortcuts";
import { isMac } from "@/lib/utils";

interface ShortcutsState {
  bindings: Record<ShortcutAction, ShortcutBinding>;
  setBinding: (action: ShortcutAction, shortcut: ShortcutBinding) => void;
  resetBinding: (action: ShortcutAction) => void;
  resetAll: () => void;
}

const mac = isMac();
const defaults = defaultShortcutBindings(mac);
const storageKey = shortcutStorageKey(mac);

export const useShortcuts = create<ShortcutsState>((set, get) => ({
  bindings: loadBindings(),
  setBinding: (action, shortcut) => {
    set({
      bindings: {
        ...get().bindings,
        [action]: normalizeShortcut(shortcut),
      },
    });
    persist(get().bindings);
  },
  resetBinding: (action) => {
    set({
      bindings: {
        ...get().bindings,
        [action]: defaults[action],
      },
    });
    persist(get().bindings);
  },
  resetAll: () => {
    set({ bindings: defaults });
    persist(defaults);
  },
}));

function loadBindings() {
  if (typeof localStorage === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<
      Record<ShortcutAction, ShortcutBinding>
    >;
    return Object.fromEntries(
      Object.entries(defaults).map(([action, fallback]) => {
        const saved = parsed[action as ShortcutAction];
        return [
          action,
          isValidShortcut(saved) ? normalizeShortcut(saved) : fallback,
        ];
      }),
    ) as Record<ShortcutAction, ShortcutBinding>;
  } catch {
    return defaults;
  }
}

function persist(bindings: Record<ShortcutAction, ShortcutBinding>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(bindings));
  } catch {
    // Non-fatal: shortcuts fall back to defaults on the next launch.
  }
}
