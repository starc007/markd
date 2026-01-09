import { useEffect, useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { EditIcon } from "@hugeicons/core-free-icons";
import { useNoteStore, UIView } from "../../stores/noteStore";
import { useNoteColors } from "../../hooks/useNoteColors";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import type { NoteColorId } from "../../lib/config";
import { Button } from "../ui";
import { DeleteNoteModal } from "../notes/DeleteNoteModal";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarNavigation } from "./SidebarNavigation";
import { HierarchicalNotesList } from "./HierarchicalNotesList";
import { SidebarSettings } from "./SidebarSettings";

export function Sidebar() {
  const {
    notes,
    ui,
    currentNote,
    loadNotes,
    loadFolders,
    createNote,
    createSubpage,
    loadNote,
    deleteNote,
    setView,
    toggleCommandPalette,
    childrenMap,
    expandedPages,
    togglePageExpanded,
  } = useNoteStore();
  const { getColor, setColor, removeColor } = useNoteColors();
  const { stickyNotes, loadStickyNotes } = useStickyNotesStore();
  const [deleteModalNoteId, setDeleteModalNoteId] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadFolders();
    loadNotes(ui.selectedFolderId || undefined, null);
    loadStickyNotes();
  }, [loadFolders, loadNotes, loadStickyNotes, ui.selectedFolderId]);

  const handleNewNote = async () => {
    const note = await createNote("Untitled", ui.selectedFolderId || undefined);
    if (note) {
      loadNote(note.id);
    }
  };

  const handleColorSelect = (
    noteId: string,
    newColorId: NoteColorId,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setColor(noteId, newColorId);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    removeColor(noteId);
    setDeleteModalNoteId(null);
    if (currentNote?.id === noteId) {
      useNoteStore.setState({ currentNote: null });
    }
  };

  // Filter and sort notes - memoized for performance
  // Only show top-level notes (parent_id is null) in the main list
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter((note) => note.parent_id === null);

    // Filter by folder if a folder is selected
    if (ui.selectedFolderId !== null) {
      filtered = filtered.filter(
        (note) => note.folder_id === ui.selectedFolderId
      );
    }

    // Sort by updated_at descending
    return [...filtered].sort((a, b) => b.updated_at - a.updated_at);
  }, [notes, ui.selectedFolderId]);

  const handleCreateSubpage = async (parentId: string) => {
    const subpage = await createSubpage(parentId, "Untitled");
    if (subpage) {
      loadNote(subpage.id);
    }
  };

  return (
    <aside className="w-[280px] shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      <SidebarSearch onSearchClick={toggleCommandPalette} />

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
        currentView={ui.currentView}
        onViewChange={setView}
      />

      <HierarchicalNotesList
        notes={filteredNotes}
        childrenMap={childrenMap}
        expandedPages={expandedPages}
        currentNoteId={currentNote?.id || null}
        getColor={getColor}
        onNoteClick={loadNote}
        onColorSelect={handleColorSelect}
        onDeleteClick={setDeleteModalNoteId}
        onToggleExpand={togglePageExpanded}
        onCreateSubpage={handleCreateSubpage}
      />

      <SidebarSettings
        onSettingsClick={() => useNoteStore.getState().setView(UIView.Settings)}
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
