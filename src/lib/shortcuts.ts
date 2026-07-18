export type ShortcutAction =
  | "commandPalette"
  | "findInNote"
  | "replaceInNote"
  | "newNote"
  | "dailyNote"
  | "openTodos"
  | "openBookmarks"
  | "focusSidebarEditor"
  | "toggleSidebar"
  | "cycleTheme"
  | "openSettings"
  | "closeTab";

export interface ShortcutBinding {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface ShortcutDefinition {
  id: ShortcutAction;
  label: string;
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: "commandPalette", label: "Command palette" },
  { id: "findInNote", label: "Find in note" },
  { id: "replaceInNote", label: "Find and replace" },
  { id: "newNote", label: "New note" },
  { id: "dailyNote", label: "Today's note" },
  { id: "openTodos", label: "Open Todos" },
  { id: "openBookmarks", label: "Open Bookmarks" },
  { id: "focusSidebarEditor", label: "Focus sidebar or editor" },
  { id: "toggleSidebar", label: "Toggle sidebar" },
  { id: "cycleTheme", label: "Cycle theme" },
  { id: "openSettings", label: "Settings" },
  { id: "closeTab", label: "Close tab" },
];

export const shortcutStorageKey = (mac: boolean) =>
  `markd:shortcuts:v1:${mac ? "mac" : "standard"}`;

export function defaultShortcutBindings(
  mac: boolean,
): Record<ShortcutAction, ShortcutBinding> {
  const mod = mac ? { meta: true } : { ctrl: true };
  return {
    commandPalette: { ...mod, key: "k" },
    findInNote: { ...mod, key: "f" },
    replaceInNote: { ctrl: true, alt: true, key: "f" },
    newNote: { ...mod, key: "n" },
    dailyNote: { ...mod, shift: true, key: "y" },
    openTodos: { ...mod, shift: true, key: "t" },
    openBookmarks: { ...mod, shift: true, key: "b" },
    focusSidebarEditor: { ...mod, shift: true, key: "e" },
    toggleSidebar: { ...mod, key: "\\" },
    cycleTheme: { ...mod, shift: true, key: "d" },
    openSettings: { ...mod, key: "," },
    closeTab: { ...mod, key: "w" },
  };
}

export function shortcutFromEvent(event: KeyboardEvent): ShortcutBinding | null {
  const key = normalizeKey(event.key);
  if (!key) return null;
  if (!event.metaKey && !event.ctrlKey && !event.altKey) return null;
  return normalizeShortcut({
    key,
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
  });
}

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutBinding,
) {
  const eventShortcut = shortcutFromEvent(event);
  return eventShortcut ? sameShortcut(eventShortcut, shortcut) : false;
}

export function sameShortcut(a: ShortcutBinding, b: ShortcutBinding) {
  const left = normalizeShortcut(a);
  const right = normalizeShortcut(b);
  return (
    left.key === right.key &&
    Boolean(left.meta) === Boolean(right.meta) &&
    Boolean(left.ctrl) === Boolean(right.ctrl) &&
    Boolean(left.alt) === Boolean(right.alt) &&
    Boolean(left.shift) === Boolean(right.shift)
  );
}

export function normalizeShortcut(shortcut: ShortcutBinding): ShortcutBinding {
  return {
    key: normalizeKey(shortcut.key) ?? shortcut.key.toLowerCase(),
    meta: shortcut.meta || undefined,
    ctrl: shortcut.ctrl || undefined,
    alt: shortcut.alt || undefined,
    shift: shortcut.shift || undefined,
  };
}

export function isValidShortcut(shortcut: unknown): shortcut is ShortcutBinding {
  if (!shortcut || typeof shortcut !== "object") return false;
  const value = shortcut as Partial<ShortcutBinding>;
  if (typeof value.key !== "string" || !normalizeKey(value.key)) return false;
  return Boolean(value.meta || value.ctrl || value.alt);
}

export function findShortcutConflict(
  bindings: Record<ShortcutAction, ShortcutBinding>,
  shortcut: ShortcutBinding,
  currentAction: ShortcutAction,
) {
  return SHORTCUT_DEFINITIONS.find(
    (definition) =>
      definition.id !== currentAction &&
      sameShortcut(bindings[definition.id], shortcut),
  );
}

export function formatShortcutParts(shortcut: ShortcutBinding, mac: boolean) {
  const normalized = normalizeShortcut(shortcut);
  const parts: string[] = [];
  if (mac) {
    if (normalized.ctrl) parts.push("⌃");
    if (normalized.alt) parts.push("⌥");
    if (normalized.shift) parts.push("⇧");
    if (normalized.meta) parts.push("⌘");
  } else {
    if (normalized.ctrl) parts.push("Ctrl");
    if (normalized.alt) parts.push("Alt");
    if (normalized.shift) parts.push("Shift");
    if (normalized.meta) parts.push("Meta");
  }
  parts.push(formatKey(normalized.key));
  return parts;
}

export function formatShortcutText(shortcut: ShortcutBinding, mac: boolean) {
  return formatShortcutParts(shortcut, mac).join(mac ? "" : "+");
}

function normalizeKey(key: string) {
  if (!key || MODIFIER_KEYS.has(key)) return null;
  if (key === " ") return "Space";
  if (key.length === 1) return key.toLowerCase();
  if (key.startsWith("Arrow")) return key;
  return key;
}

function formatKey(key: string) {
  if (key === " ") return "Space";
  if (key === "Space") return "Space";
  if (key === "\\") return "\\";
  if (key.length === 1) return key.toUpperCase();
  return key.replace(/^Arrow/, "");
}

const MODIFIER_KEYS = new Set([
  "Alt",
  "AltGraph",
  "Control",
  "Meta",
  "Shift",
  "Fn",
  "FnLock",
]);
