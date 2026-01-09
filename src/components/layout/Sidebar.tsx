import { useEffect, useState, useMemo, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { EditIcon } from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";
import { useUIStore, UIView } from "../../stores/uiStore";
import { useNoteColors } from "../../hooks/useNoteColors";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import type { NoteColorId } from "../../lib/config";
import { Button } from "../ui";
import { DeleteNoteModal } from "../notes/DeleteNoteModal";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarNavigation } from "./SidebarNavigation";
import { HierarchicalNotesList } from "./HierarchicalNotesList";
import { SidebarSettings } from "./SidebarSettings";
import { toast } from "sonner";

export function Sidebar() {
  // Use selective subscriptions to prevent unnecessary re-renders
  const notes = useNoteStore((state) => state.notes);
  const currentNote = useNoteStore((state) => state.currentNote);
  const selectedFolderId = useUIStore((state) => state.selectedFolderId);
  const childrenMap = useNoteStore((state) => state.childrenMap);
  const expandedPages = useNoteStore((state) => state.expandedPages);

  const { getColor, setColor, removeColor } = useNoteColors();
  const { stickyNotes, loadStickyNotes } = useStickyNotesStore();
  const [deleteModalNoteId, setDeleteModalNoteId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const { loadFolders, loadNotes } = useNoteStore.getState();
    loadFolders();
    loadNotes(selectedFolderId || undefined, null);
    loadStickyNotes();
  }, [selectedFolderId, loadStickyNotes]);

  const handleNewNote = useCallback(async () => {
    try {
      const { createNote, loadNote } = useNoteStore.getState();
      const note = await createNote("Untitled", selectedFolderId || undefined);
      if (note) {
        await loadNote(note.id);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error(
        `Failed to create note: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [selectedFolderId]);

  const handleColorSelect = useCallback(
    (noteId: string, newColorId: NoteColorId, e: React.MouseEvent) => {
      e.stopPropagation();
      setColor(noteId, newColorId);
    },
    [setColor],
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      try {
        const { deleteNote } = useNoteStore.getState();
        await deleteNote(noteId);
        removeColor(noteId);
        setDeleteModalNoteId(null);
        if (currentNote?.id === noteId) {
          useNoteStore.setState({ currentNote: null });
        }
      } catch (error) {
        console.error("Failed to delete note:", error);
        toast.error(
          `Failed to delete note: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [currentNote?.id, removeColor],
  );

  // Filter and sort notes - memoized for performance
  // Only show top-level notes (parent_id is null) in the main list
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter((note) => note.parent_id === null);

    // Filter by folder if a folder is selected
    if (selectedFolderId !== null) {
      filtered = filtered.filter((note) => note.folder_id === selectedFolderId);
    }

    // Sort by updated_at descending
    return [...filtered].sort((a, b) => b.updated_at - a.updated_at);
  }, [notes, selectedFolderId]);

  const handleCreateSubpage = useCallback(async (parentId: string) => {
    try {
      const { createSubpage, loadNote } = useNoteStore.getState();
      const subpage = await createSubpage(parentId, "Untitled");
      if (subpage) {
        await loadNote(subpage.id);
      }
    } catch (error) {
      console.error("Failed to create subpage:", error);
      toast.error(
        `Failed to create subpage: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  const handleSearchClick = useCallback(() => {
    useUIStore.getState().toggleCommandPalette();
  }, []);

  const handleNoteClick = useCallback((noteId: string) => {
    useNoteStore.getState().loadNote(noteId);
  }, []);

  const handleToggleExpand = useCallback((pageId: string) => {
    useNoteStore.getState().togglePageExpanded(pageId);
  }, []);

  const currentView = useUIStore((state) => state.currentView);

  return (
    <aside className="w-[280px] shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      <SidebarSearch onSearchClick={handleSearchClick} />

      {/* New Note Button */}
      <div className="pt-3 px-3">
        <Button
          onClick={handleNewNote}
          className="hover:bg-transparent [-webkit-app-region:no-drag]"
          variant="ghost"
        >
          <HugeiconsIcon
            icon={EditIcon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
          />
          New Note
        </Button>
      </div>

      <SidebarNavigation
        stickyNotesCount={stickyNotes.length}
        currentView={currentView}
        onViewChange={(view) => useUIStore.getState().setView(view)}
      />

      <HierarchicalNotesList
        notes={filteredNotes}
        childrenMap={childrenMap}
        expandedPages={expandedPages}
        currentNoteId={currentNote?.id || null}
        getColor={getColor}
        onNoteClick={handleNoteClick}
        onColorSelect={handleColorSelect}
        onDeleteClick={setDeleteModalNoteId}
        onToggleExpand={handleToggleExpand}
        onCreateSubpage={handleCreateSubpage}
      />

      <SidebarSettings
        onSettingsClick={() => useUIStore.getState().setView(UIView.Settings)}
      />

      {/* Delete Note Modal */}
      {deleteModalNoteId && (
        <DeleteNoteModal
          isOpen={!!deleteModalNoteId}
          onClose={() => setDeleteModalNoteId(null)}
          onConfirm={() => handleDeleteNote(deleteModalNoteId)}
          noteTitle={notes.find((n) => n.id === deleteModalNoteId)?.title}
        />
      )}
    </aside>
  );
}
