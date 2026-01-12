import { useState } from "react";
import {
  useSettingsStore,
  type KeyboardShortcut,
  type KeyboardShortcuts,
} from "@/stores/settingsStore";
import { Button } from "@/components/ui";

interface KeyboardShortcutEditorProps {
  label: string;
  action: keyof KeyboardShortcuts;
  shortcut: KeyboardShortcut;
  onUpdate: (shortcut: KeyboardShortcut) => void;
}

function KeyboardShortcutEditor({
  label,
  shortcut,
  onUpdate,
}: KeyboardShortcutEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<{
    key: string;
    meta: boolean;
    shift: boolean;
    alt: boolean;
    ctrl: boolean;
  }>({
    key: shortcut.key,
    meta: shortcut.meta ?? false,
    shift: shortcut.shift ?? false,
    alt: shortcut.alt ?? false,
    ctrl: shortcut.ctrl ?? false,
  });

  // Reset currentKeys when editing starts
  const handleStartEditing = () => {
    setCurrentKeys({
      key: shortcut.key,
      meta: shortcut.meta ?? false,
      shift: shortcut.shift ?? false,
      alt: shortcut.alt ?? false,
      ctrl: shortcut.ctrl ?? false,
    });
    setIsEditing(true);
  };

  const formatShortcut = (s: KeyboardShortcut): string => {
    const parts: string[] = [];
    if (s.meta) parts.push("⌘");
    if (s.ctrl) parts.push("⌃");
    if (s.alt) parts.push("⌥");
    if (s.shift) parts.push("⇧");
    // Format key display
    const keyDisplay = s.key === "space" ? "Space" : s.key === "\\" ? "\\" : s.key.toUpperCase();
    parts.push(keyDisplay);
    return parts.join(" + ");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const key = e.key.toLowerCase();
    if (key === "escape") {
      setIsEditing(false);
      // Reset to original values
      setCurrentKeys({
        key: shortcut.key,
        meta: shortcut.meta ?? false,
        shift: shortcut.shift ?? false,
        alt: shortcut.alt ?? false,
        ctrl: shortcut.ctrl ?? false,
      });
      return;
    }

    if (key === "enter" || key === " ") {
      setIsEditing(false);
      onUpdate({
        action: shortcut.action,
        key: currentKeys.key,
        meta: currentKeys.meta,
        shift: currentKeys.shift,
        alt: currentKeys.alt,
        ctrl: currentKeys.ctrl,
      });
      return;
    }

    // Don't capture modifier keys alone
    if (["meta", "control", "alt", "shift"].includes(key)) {
      return;
    }

    // Normalize key name
    let normalizedKey = key;
    if (key === " ") {
      normalizedKey = "space";
    } else if (key === "\\") {
      normalizedKey = "\\";
    }

    setCurrentKeys({
      key: normalizedKey,
      meta: e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
      ctrl: e.ctrlKey,
    });
  };

  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {isEditing ? (
        <div
          className="px-3 py-1.5 bg-background border-2 border-primary rounded text-sm font-mono text-foreground min-w-[120px] text-center focus:outline-none"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          autoFocus
        >
          {formatShortcut({
            action: shortcut.action,
            ...currentKeys,
          }) || "Press keys..."}
        </div>
      ) : (
        <button
          onClick={handleStartEditing}
          className="px-3 py-1.5 bg-background border border-border rounded text-sm font-mono text-foreground hover:bg-muted transition-colors"
        >
          {formatShortcut(shortcut)}
        </button>
      )}
    </div>
  );
}

export function KeyboardShortcuts() {
  const { keyboardShortcuts, setKeyboardShortcut, resetKeyboardShortcuts } =
    useSettingsStore();

  const shortcuts: Array<{
    label: string;
    action: keyof typeof keyboardShortcuts;
  }> = [
    { label: "Command Palette", action: "commandPalette" },
    { label: "New Note", action: "newNote" },
    { label: "New Sticky Note", action: "newStickyNote" },
    { label: "Open Sticky Notes", action: "openStickyNotes" },
    { label: "Open Bookmarks", action: "openBookmarks" },
    { label: "Open Settings", action: "openSettings" },
    { label: "Toggle Sidebar", action: "toggleSidebar" },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Keyboard Shortcuts
        </h2>
        <Button variant="secondary" size="sm" onClick={resetKeyboardShortcuts}>
          Reset to Defaults
        </Button>
      </div>
      <div className="space-y-2">
        {shortcuts.map(({ label, action }) => (
          <KeyboardShortcutEditor
            key={action}
            label={label}
            action={action}
            shortcut={keyboardShortcuts[action]}
            onUpdate={(shortcut) => setKeyboardShortcut(action, shortcut)}
          />
        ))}
      </div>
    </section>
  );
}
