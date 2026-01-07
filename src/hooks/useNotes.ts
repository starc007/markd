import { useEffect } from "react";
import { useNoteStore } from "../stores/noteStore";

export function useNotes() {
  const {
    notes,
    currentNote,
    isLoading,
    error,
    loadNotes,
    loadNote,
    createNote,
    updateNote,
    deleteNote,
  } = useNoteStore();

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    currentNote,
    isLoading,
    error,
    loadNotes,
    loadNote,
    createNote,
    updateNote,
    deleteNote,
  };
}
