import { create } from "zustand";
import type { NoteColorId } from "@/lib/config";
import * as commands from "@/lib/tauri/commands";
import { useUIStore } from "@/stores/uiStore";

// Frontend representation of sticky note (with camelCase)
export interface StickyNote {
  id: string;
  content: string;
  colorId: NoteColorId;
  createdAt: number;
  updatedAt: number;
}

// Convert backend format (snake_case) to frontend format (camelCase)
function fromBackend(note: commands.StickyNote): StickyNote {
  return {
    id: note.id,
    content: note.content,
    colorId: note.color_id as NoteColorId,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

// Convert frontend format (camelCase) to backend format (snake_case)
function toBackend(note: Partial<StickyNote>): {
  content?: string;
  color_id?: string;
} {
  const result: { content?: string; color_id?: string } = {};
  if (note.content !== undefined) result.content = note.content;
  if (note.colorId !== undefined) result.color_id = note.colorId;
  return result;
}

interface StickyNotesStore {
  // State
  stickyNotes: StickyNote[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createStickyNote: () => Promise<StickyNote>;
  updateStickyNote: (
    id: string,
    updates: Partial<Pick<StickyNote, "content" | "colorId">>
  ) => Promise<void>;
  deleteStickyNote: (id: string) => Promise<void>;
  loadStickyNotes: () => Promise<void>;
}

export const useStickyNotesStore = create<StickyNotesStore>((set) => ({
  // Initial state
  stickyNotes: [],
  isLoading: false,
  error: null,

  // Actions
  createStickyNote: async () => {
    set({ isLoading: true, error: null });
    try {
      const note = await commands.createStickyNote({
        content: "",
        color_id: "default",
      });
      const frontendNote = fromBackend(note);
      set((state) => ({
        stickyNotes: [frontendNote, ...state.stickyNotes],
        isLoading: false,
      }));
      useUIStore.getState().setSelectedStickyNoteId(frontendNote.id);
      return frontendNote;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateStickyNote: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const backendUpdates = toBackend(updates);
      const updated = await commands.updateStickyNote({
        id,
        ...backendUpdates,
      });
      const frontendNote = fromBackend(updated);
      set((state) => ({
        stickyNotes: state.stickyNotes.map((note) =>
          note.id === id ? frontendNote : note
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  deleteStickyNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await commands.deleteStickyNote(id);
      set((state) => ({
        stickyNotes: state.stickyNotes.filter((note) => note.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  loadStickyNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await commands.listStickyNotes();
      const frontendNotes = notes.map(fromBackend);
      set({ stickyNotes: frontendNotes, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
}));
