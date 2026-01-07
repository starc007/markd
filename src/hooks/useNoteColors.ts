import { useState, useEffect, useCallback } from "react";
import type { NoteColorId } from "../lib/config";

const STORAGE_KEY = "draft-note-colors";

type NoteColors = Record<string, NoteColorId>;

export function useNoteColors() {
  const [colors, setColors] = useState<NoteColors>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist to localStorage whenever colors change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    } catch (error) {
      console.error("Failed to save note colors:", error);
    }
  }, [colors]);

  const getColor = useCallback(
    (noteId: string): NoteColorId => {
      return colors[noteId] || "default";
    },
    [colors]
  );

  const setColor = useCallback((noteId: string, colorId: NoteColorId) => {
    setColors((prev) => ({
      ...prev,
      [noteId]: colorId,
    }));
  }, []);

  const removeColor = useCallback((noteId: string) => {
    setColors((prev) => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  }, []);

  return { colors, getColor, setColor, removeColor };
}
