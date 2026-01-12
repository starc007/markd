import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { EditIcon } from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";
import { useUIStore, UIView } from "../../stores/uiStore";
import { useNoteColors } from "../../hooks/useNoteColors";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import { useBookmarkStore } from "../../stores/bookmarkStore";
import type { NoteColorId } from "../../lib/config";
import { Button } from "../ui";
import { DeleteNoteModal } from "../notes/DeleteNoteModal";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarNavigation } from "./SidebarNavigation";
import { HierarchicalNotesList } from "./HierarchicalNotesList";
import { SidebarSettings } from "./SidebarSettings";
import { toast } from "sonner";

export const Sidebar = memo(function Sidebar() {
  const notes = useNoteStore((state) => state.notes);
  const currentNoteId = useNoteStore((state) => state.currentNote?.id ?? null);
  const selectedFolderId = useUIStore((state) => state.selectedFolderId);
  const childrenMap = useNoteStore((state) => state.childrenMap);
  const expandedPages = useNoteStore((state) => state.expandedPages);

  const { getColor, setColor, removeColor } = useNoteColors();
  const { stickyNotes, loadStickyNotes } = useStickyNotesStore();
  const { bookmarks, loadBookmarks } = useBookmarkStore();
  const [deleteModalNoteId, setDeleteModalNoteId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const { loadFolders, loadNotes } = useNoteStore.getState();
    loadFolders();
    loadNotes(selectedFolderId || undefined, null);
    loadStickyNotes();
    loadBookmarks(selectedFolderId || undefined);
  }, [selectedFolderId, loadStickyNotes, loadBookmarks]);

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
        `Failed to create note: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [selectedFolderId]);

  const handleColorSelect = useCallback(
    (noteId: string, newColorId: NoteColorId, e: React.MouseEvent) => {
      e.stopPropagation();
      setColor(noteId, newColorId);
    },
    [setColor]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      try {
        const { deleteNote, currentNote } = useNoteStore.getState();
        await deleteNote(noteId);
        removeColor(noteId);
        setDeleteModalNoteId(null);
        if (currentNote?.id === noteId) {
          useNoteStore.setState({ currentNote: null });
        }
      } catch (error) {
        console.error("Failed to delete note:", error);
        toast.error(
          `Failed to delete note: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [removeColor]
  );

  // Filter and sort notes - memoized for performance
  // Only show top-level notes (parent_id is null) in the main list
  // Use a stable sort key to prevent unnecessary re-sorting
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter((note) => note.parent_id === null);

    // Filter by folder if a folder is selected
    if (selectedFolderId !== null) {
      filtered = filtered.filter((note) => note.folder_id === selectedFolderId);
    }

    // Sort by updated_at descending
    // Create a stable sorted array - only create new array if order actually changed
    const sorted = [...filtered].sort((a, b) => {
      // Primary sort: updated_at descending
      const timeDiff = b.updated_at - a.updated_at;
      if (timeDiff !== 0) return timeDiff;
      // Secondary sort: id (for stability)
      return a.id.localeCompare(b.id);
    });

    return sorted;
  }, [notes, selectedFolderId]);

  const handleCreateSubpage = useCallback(async (parentId: string) => {
    try {
      const { createSubpage } = useNoteStore.getState();
      // createSubpage already navigates to the newly created subpage
      await createSubpage(parentId, "Untitled");
    } catch (error) {
      console.error("Failed to create subpage:", error);
      toast.error(
        `Failed to create subpage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const handleSearchClick = useCallback(() => {
    useUIStore.getState().toggleCommandPalette();
  }, []);

  const handleNoteClick = useCallback((noteId: string) => {
    useUIStore.getState().setView(UIView.None);
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
        bookmarksCount={bookmarks.length}
        currentView={currentView}
        onViewChange={(view) => useUIStore.getState().setView(view)}
      />

      <HierarchicalNotesList
        notes={filteredNotes}
        childrenMap={childrenMap}
        expandedPages={expandedPages}
        currentNoteId={currentNoteId}
        getColor={getColor}
        onNoteClick={handleNoteClick}
        onColorSelect={handleColorSelect}
        onDeleteClick={setDeleteModalNoteId}
        onToggleExpand={handleToggleExpand}
        onCreateSubpage={handleCreateSubpage}
      />

      <SidebarSettings />

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
});
