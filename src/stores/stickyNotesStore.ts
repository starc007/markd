import { create } from "zustand";
import type { NoteColorId } from "../lib/config";

const STORAGE_KEY = "draft-sticky-notes";

export interface StickyNote {
  id: string;
  content: string;
  colorId: NoteColorId;
  createdAt: number;
  updatedAt: number;
}

interface StickyNotesStore {
  // State
  stickyNotes: StickyNote[];

  // Actions
  createStickyNote: () => StickyNote;
  updateStickyNote: (
    id: string,
    updates: Partial<Pick<StickyNote, "content" | "colorId">>
  ) => void;
  deleteStickyNote: (id: string) => void;
  loadStickyNotes: () => void;
}

// Load sticky notes from localStorage
const loadStickyNotesFromStorage = (): StickyNote[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save sticky notes to localStorage
const saveStickyNotesToStorage = (stickyNotes: StickyNote[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stickyNotes));
  } catch (error) {
    console.error("Failed to save sticky notes:", error);
  }
};

export const useStickyNotesStore = create<StickyNotesStore>((set, get) => ({
  // Initial state
  stickyNotes: loadStickyNotesFromStorage(),

  // Actions
  createStickyNote: () => {
    const newNote: StickyNote = {
      id: crypto.randomUUID(),
      content: "",
      colorId: "default",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedNotes = [newNote, ...get().stickyNotes];
    set({ stickyNotes: updatedNotes });
    saveStickyNotesToStorage(updatedNotes);
    return newNote;
  },

  updateStickyNote: (id, updates) => {
    const updatedNotes = get().stickyNotes.map((note) =>
      note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
    );
    set({ stickyNotes: updatedNotes });
    saveStickyNotesToStorage(updatedNotes);
  },

  deleteStickyNote: (id) => {
    const updatedNotes = get().stickyNotes.filter((note) => note.id !== id);
    set({ stickyNotes: updatedNotes });
    saveStickyNotesToStorage(updatedNotes);
  },

  loadStickyNotes: () => {
    const notes = loadStickyNotesFromStorage();
    set({ stickyNotes: notes });
  },
}));
