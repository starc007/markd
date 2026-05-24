import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { EditIcon } from "@hugeicons/core-free-icons";
import { useNoteStore } from "@/stores/noteStore";
import { useTabStore } from "@/stores/tabStore";
import { useUIStore, UIView } from "@/stores/uiStore";
import { useNoteColors } from "@/hooks/useNoteColors";
import { useStickyNotesStore } from "../../features/sticky-notes/stores/stickyNotesStore";
import { useBookmarkStore } from "@/features/bookmarks/stores/bookmarkStore";

import { Button } from "../ui";
import { DeleteNoteModal } from "@/components/DeleteNoteModal";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarNavigation } from "./SidebarNavigation";
import { HierarchicalNotesList } from "./HierarchicalNotesList";
import { SidebarSettings } from "./SidebarSettings";
import { toast } from "sonner";
import { UpdateIndicator } from "../update/UpdateIndicator";

export const Sidebar = memo(function Sidebar() {
  const notes = useNoteStore((state) => state.notes);
  const childrenMap = useNoteStore((state) => state.childrenMap);
  const expandedPages = useNoteStore((state) => state.expandedPages);
  const trashedNotes = useNoteStore((state) => state.trashedNotes);
  const { openTab } = useTabStore();

  // Get current note ID from active tab
  const activeTabId = useTabStore((state) => state.activeTabId);

  const { removeColor } = useNoteColors();
  const { stickyNotes, loadStickyNotes } = useStickyNotesStore();
  const { bookmarks, loadBookmarks } = useBookmarkStore();

  const [deleteModalNoteId, setDeleteModalNoteId] = useState<string | null>(
    null
  );
  const { loadFolders, loadNotes, loadTrashedNotes } = useNoteStore.getState();

  useEffect(() => {
    loadFolders();
    loadNotes(undefined, null);
    loadTrashedNotes();
    loadStickyNotes();
    loadBookmarks(undefined);
  }, [loadFolders, loadNotes, loadTrashedNotes, loadStickyNotes, loadBookmarks]);

  const handleNewNote = useCallback(async () => {
    try {
      const { createNote } = useNoteStore.getState();
      const note = await createNote("Untitled", undefined);
      if (note) {
        useUIStore.getState().setView(UIView.None);
        // Note: createNote already opens the tab, so we don't need to call openTab again
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error(
        `Failed to create note: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      try {
        const { deleteNote } = useNoteStore.getState();
        await deleteNote(noteId);
        removeColor(noteId);
        setDeleteModalNoteId(null);
      } catch (error) {
        console.error("Failed to delete note:", error);
        toast.error(
          `Failed to delete note: ${error instanceof Error ? error.message : "Unknown error"
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
    const filtered = notes.filter((note) => note.parent_id === null);

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
  }, [notes]);

  const handleCreateSubpage = useCallback(async (parentId: string) => {
    try {
      const { createSubpage } = useNoteStore.getState();
      await createSubpage(parentId, "Untitled");
    } catch (error) {
      console.error("Failed to create subpage:", error);
      toast.error(
        `Failed to create subpage: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const handleSearchClick = useCallback(() => {
    useUIStore.getState().toggleCommandPalette();
  }, []);

  const handleNoteClick = useCallback(
    async (noteId: string) => {
      useUIStore.getState().setView(UIView.None);
      // Open in tab (will switch if already open)
      await openTab(noteId);
    },
    [openTab]
  );

  const handleToggleExpand = useCallback((pageId: string) => {
    useNoteStore.getState().togglePageExpanded(pageId);
  }, []);

  const currentView = useUIStore((state) => state.currentView);

  return (
    <aside className="draft-sidebar w-[280px] shrink-0 flex flex-col bg-sidebar overflow-hidden relative">
      <div className="h-[30px] shrink-0" data-tauri-drag-region />
      <UpdateIndicator />
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
        currentNoteId={activeTabId}
        onNoteClick={handleNoteClick}
        onDeleteClick={setDeleteModalNoteId}
        onToggleExpand={handleToggleExpand}
        onCreateSubpage={handleCreateSubpage}
      />

      <SidebarSettings trashedNotesCount={trashedNotes.length} />

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
