import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";

export function useKeyboardShortcuts() {
  const {
    toggleSidebar,
    toggleFocusMode,
    toggleCommandPalette,
    setCommandPaletteOpen,
    createNote,
    deleteNote,
    currentNote,
    saveCurrentNoteContent,
  } = useNoteStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Command palette: Cmd+K or Cmd+P
      if (isMod && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // New note: Cmd+N
      if (isMod && e.key === "n") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Save: Cmd+S (handled by editor, but prevent default)
      if (isMod && e.key === "s") {
        e.preventDefault();
        if (currentNote) {
          // The editor handles its own saving, but we can trigger it from here too
          // This is mainly to prevent the browser's save dialog
        }
        return;
      }

      // Toggle sidebar: Cmd+\
      if (isMod && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Focus mode: Cmd+Shift+F
      if (isMod && isShift && e.key === "f") {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // Delete note: Cmd+Backspace
      if (isMod && e.key === "Backspace" && currentNote) {
        e.preventDefault();
        if (confirm(`Delete "${currentNote.title || "Untitled"}"?`)) {
          deleteNote(currentNote.id);
        }
        return;
      }

      // Quick switch: Cmd+O
      if (isMod && e.key === "o") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Escape: Close command palette
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleSidebar,
    toggleFocusMode,
    toggleCommandPalette,
    setCommandPaletteOpen,
    createNote,
    deleteNote,
    currentNote,
    saveCurrentNoteContent,
  ]);
}
