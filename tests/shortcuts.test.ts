import { describe, expect, test } from "bun:test";
import {
  findShortcutConflict,
  formatShortcutText,
  matchesShortcut,
  normalizeShortcut,
  sameShortcut,
  type ShortcutBinding,
} from "../src/lib/shortcuts";

function keyEvent(
  key: string,
  init: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  return { key, ...init } as KeyboardEvent;
}

describe("shortcuts", () => {
  test("normalizes single-character keys", () => {
    expect(normalizeShortcut({ meta: true, shift: true, key: "K" })).toEqual({
      meta: true,
      shift: true,
      key: "k",
    });
  });

  test("matches keyboard events against saved shortcuts", () => {
    const shortcut: ShortcutBinding = { meta: true, shift: true, key: "k" };

    expect(matchesShortcut(keyEvent("K", { metaKey: true, shiftKey: true }), shortcut)).toBe(
      true,
    );
    expect(matchesShortcut(keyEvent("K", { ctrlKey: true, shiftKey: true }), shortcut)).toBe(
      false,
    );
  });

  test("detects conflicting editable shortcuts", () => {
    const bindings = {
      commandPalette: { meta: true, key: "k" },
      findInNote: { meta: true, key: "f" },
      replaceInNote: { ctrl: true, alt: true, key: "f" },
      newNote: { meta: true, key: "n" },
      dailyNote: { meta: true, shift: true, key: "y" },
      openTodos: { meta: true, shift: true, key: "t" },
      openBookmarks: { meta: true, shift: true, key: "b" },
      focusSidebarEditor: { meta: true, shift: true, key: "e" },
      toggleSidebar: { meta: true, key: "\\" },
      cycleTheme: { meta: true, shift: true, key: "d" },
      openSettings: { meta: true, key: "," },
      closeTab: { meta: true, key: "w" },
    };

    expect(
      findShortcutConflict(bindings, { meta: true, key: "k" }, "newNote")?.id,
    ).toBe("commandPalette");
    expect(sameShortcut({ meta: true, key: "K" }, { meta: true, key: "k" })).toBe(
      true,
    );
  });

  test("formats platform shortcut text", () => {
    expect(formatShortcutText({ meta: true, shift: true, key: "k" }, true)).toBe(
      "⇧⌘K",
    );
    expect(formatShortcutText({ ctrl: true, shift: true, key: "k" }, false)).toBe(
      "Ctrl+Shift+K",
    );
  });
});
