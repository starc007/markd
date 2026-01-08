import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SettingsIcon,
  EditIcon,
  MoreVerticalIcon,
  DeleteIcon,
  Tick02Icon,
  StickyNoteIcon,
  Bookmark01Icon,
} from "@hugeicons/core-free-icons";
import { useNoteStore, UIView } from "../../stores/noteStore";
import { useNoteColors } from "../../hooks/useNoteColors";
import { useStickyNotesStore } from "../../stores/stickyNotesStore";
import { getNoteColor, NOTE_COLORS } from "../../lib/config";
import type { NoteColorId } from "../../lib/config";

import {
  Button,
  NavItem,
  SectionHeading,
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "../ui";
import { DeleteNoteModal } from "../notes/DeleteNoteModal";

export function Sidebar() {
  const {
    notes,
    ui,
    currentNote,
    loadNotes,
    loadFolders,
    createNote,
    loadNote,
    deleteNote,
    setView,
  } = useNoteStore();
  const { getColor, setColor, removeColor } = useNoteColors();
  const { stickyNotes, loadStickyNotes } = useStickyNotesStore();
  const [deleteModalNoteId, setDeleteModalNoteId] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadFolders();
    loadNotes();
    loadStickyNotes();
  }, [loadFolders, loadNotes, loadStickyNotes]);

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

  return (
    <aside className="w-[280px] shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
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

      {/* Navigation - Fixed */}
      <div className="shrink-0 p-3 space-y-6 border-b border-sidebar-border">
        {/* Sticky Notes Section */}
        <div>
          <SectionHeading>Personal</SectionHeading>
          <div className="space-y-0.5">
            <NavItem
              icon={
                <HugeiconsIcon
                  icon={StickyNoteIcon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
              label="Sticky Notes"
              count={stickyNotes.length}
              isActive={ui.currentView === UIView.StickyNotes}
              onClick={() => setView(UIView.StickyNotes)}
            />
            <NavItem
              icon={
                <HugeiconsIcon
                  icon={Bookmark01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
              label="Bookmarks"
              count={0}
              isActive={false}
              onClick={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Notes List Section - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2">
          <SectionHeading>Notes</SectionHeading>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {(() => {
            let filteredNotes = notes;

            // Filter by folder if a folder is selected
            if (ui.selectedFolderId !== null) {
              filteredNotes = notes.filter(
                (note) => note.folder_id === ui.selectedFolderId
              );
            }

            // Sort by updated_at descending
            const sortedNotes = [...filteredNotes].sort(
              (a, b) => b.updated_at - a.updated_at
            );

            if (sortedNotes.length === 0) {
              return (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No notes yet
                </p>
              );
            }

            return sortedNotes.map((note) => {
              const isActive = currentNote?.id === note.id;
              const colorId = getColor(note.id);
              const color = getNoteColor(colorId);
              return (
                <div key={note.id} className="group relative">
                  <button
                    onClick={() => loadNote(note.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors [-webkit-app-region:no-drag] ${
                      isActive
                        ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent text-sidebar-sidebar-foreground"
                    }`}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-1 h-5 rounded-full shrink-0"
                      style={{ backgroundColor: color.darkHeader }}
                    />
                    {/* <HugeiconsIcon
                      icon={File02Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.5}
                      className={`shrink-0 ${
                        isActive ? "opacity-100" : "opacity-40"
                      }`}
                    /> */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium truncate ${
                          isActive
                            ? "text-accent-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {note.title || "Untitled"}
                      </div>
                    </div>
                    {/* Dropdown Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 [-webkit-app-region:no-drag]">
                      <Dropdown>
                        <DropdownTrigger>
                          <IconButton
                            onClick={(e) => e.stopPropagation()}
                            size="sm"
                            title="More options"
                          >
                            <HugeiconsIcon
                              icon={MoreVerticalIcon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.5}
                            />
                          </IconButton>
                        </DropdownTrigger>

                        <DropdownContent align="end" className="w-48">
                          <DropdownLabel>Background Color</DropdownLabel>
                          <div
                            className="px-2 pb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-7 gap-1">
                              {NOTE_COLORS.map((c) => (
                                <motion.button
                                  key={c.id}
                                  onClick={(e) =>
                                    handleColorSelect(note.id, c.id, e)
                                  }
                                  className="w-5 h-5 rounded-md border border-border/50 hover:border-ring/50 flex items-center justify-center"
                                  style={{ backgroundColor: c.darkHeader }}
                                  title={c.name}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.95 }}
                                  transition={{ duration: 0.1 }}
                                >
                                  {colorId === c.id && (
                                    <HugeiconsIcon
                                      icon={Tick02Icon}
                                      size={12}
                                      color="currentColor"
                                      strokeWidth={1.5}
                                      className="text-foreground/70"
                                    />
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          <DropdownSeparator />

                          <DropdownItem
                            onClick={(e) => {
                              e?.stopPropagation();
                              setDeleteModalNoteId(note.id);
                            }}
                            variant="destructive"
                          >
                            <HugeiconsIcon
                              icon={DeleteIcon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.5}
                            />
                            Delete note
                          </DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    </div>
                  </button>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Settings Section */}
      <div className="p-3 border-t border-sidebar-border">
        <SectionHeading>Settings</SectionHeading>
        <div className="space-y-0.5">
          <NavItem
            icon={
              <HugeiconsIcon
                icon={SettingsIcon}
                size={20}
                color="currentColor"
                strokeWidth={1.5}
              />
            }
            label="Settings"
            onClick={() => {
              useNoteStore.getState().setView(UIView.Settings);
            }}
          />
        </div>
      </div>

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
