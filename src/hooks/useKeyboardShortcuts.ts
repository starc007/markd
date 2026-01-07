import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";

export function useKeyboardShortcuts() {
  const {
    toggleFocusMode,
    toggleCommandPalette,
    setCommandPaletteOpen,
    createNote,
    loadNote,
  } = useNoteStore();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Unified search/command palette: Cmd+K or Cmd+P
      if (isMod && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // New note: Cmd+N - create Untitled note and open it
      if (isMod && e.key === "n") {
        e.preventDefault();
        const note = await createNote("Untitled");
        if (note) {
          loadNote(note.id);
        }
        return;
      }

      // Save: Cmd+S (handled by editor, but prevent default)
      if (isMod && e.key === "s") {
        e.preventDefault();
        return;
      }

      // Toggle sidebar: Cmd+\
      if (isMod && e.key === "\\") {
        e.preventDefault();
        toggleFocusMode();
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
    toggleFocusMode,
    toggleCommandPalette,
    setCommandPaletteOpen,
    createNote,
    loadNote,
  ]);
}
