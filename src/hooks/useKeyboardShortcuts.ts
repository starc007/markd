import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";
import { useUIStore, UIView } from "../stores/uiStore";
import { useStickyNotesStore } from "../stores/stickyNotesStore";

export function useKeyboardShortcuts() {
  const { createNote, loadNote } = useNoteStore();
  const {
    toggleFocusMode,
    toggleCommandPalette,
    setCommandPaletteOpen,
    setView,
  } = useUIStore();
  const { createStickyNote } = useStickyNotesStore();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Don't handle shortcuts when typing in inputs/textarea (except for Escape and modifier combinations)
      const target = e.target as HTMLElement;
      if (
        e.key !== "Escape" &&
        !isMod &&
        (target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable)
      ) {
        return;
      }

      // Unified search/command palette: Cmd+K or Cmd+P
      if (isMod && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // New note: Cmd+N - create Untitled note and open it
      if (isMod && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        const note = await createNote("Untitled");
        if (note) {
          loadNote(note.id);
        }
        return;
      }

      // New sticky note: Cmd+Shift+N - create sticky note and navigate to sticky notes
      if (isMod && e.key === "n" && e.shiftKey) {
        e.preventDefault();
        await createStickyNote();
        setView(UIView.StickyNotes);
        return;
      }

      // Open sticky notes: Cmd+Shift+O - open sticky notes
      if (isMod && e.key === "o" && e.shiftKey) {
        e.preventDefault();
        setView(UIView.StickyNotes);
        return;
      }

      // Save: Cmd+S (handled by editor, but prevent default)
      if (isMod && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        return;
      }

      // Settings: Cmd+Shift+T - open settings
      if (isMod && e.key.toLowerCase() === "t" && e.shiftKey) {
        e.preventDefault();
        setView(UIView.Settings);
        return;
      }

      // Toggle sidebar: Cmd+\
      if (isMod && e.key === "\\") {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // Escape: Close command palette
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    toggleFocusMode,
    toggleCommandPalette,
    setCommandPaletteOpen,
    createNote,
    loadNote,
    createStickyNote,
    setView,
  ]);
}
