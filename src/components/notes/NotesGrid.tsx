import { useEffect, useState } from "react";
import { List, SquaresFour, FileText } from "@phosphor-icons/react";
import { useNoteStore } from "../../stores/noteStore";
import { useNoteColors } from "../../hooks/useNoteColors";
import { NoteCard } from "./NoteCard";
import { ToggleGroup, EmptyState } from "../ui";
import type { NoteColorId } from "../../lib/config";

export function NotesGrid() {
  const { notes, folders, ui, loadNotes, loadNote, deleteNote } =
    useNoteStore();
  const { getColor, setColor, removeColor } = useNoteColors();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter(
    (note) =>
      ui.selectedFolderId === null || note.folder_id === ui.selectedFolderId
  );

  const handleOpenNote = (noteId: string) => {
    loadNote(noteId);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    removeColor(noteId);
  };

  const handleColorChange = (noteId: string, colorId: NoteColorId) => {
    setColor(noteId, colorId);
  };

  const currentFolder = ui.selectedFolderId
    ? folders.find((f) => f.id === ui.selectedFolderId)
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-sidebar">
      {/* Draggable region for macOS */}
      <div
        className="h-[50px] shrink-0 flex items-center justify-between px-6"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-2 text-sm [-webkit-app-region:no-drag]">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">
            {currentFolder?.name || "All notes"}
          </span>
        </div>
        <ToggleGroup
          value={viewMode}
          onChange={setViewMode}
          options={[
            {
              value: "list",
              icon: <List className="w-4 h-4" />,
              title: "List view",
            },
            {
              value: "grid",
              icon: <SquaresFour className="w-4 h-4" />,
              title: "Grid view",
            },
          ]}
        />
      </div>

      {/* Search */}
      {/* <div className="flex items-center gap-3 px-6 py-4 border-t border-sidebar-border"></div> */}

      {/* Notes Grid/List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 border-t border-sidebar-border">
        {filteredNotes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16" />}
            title="No notes yet"
            description='Click "New Note" in the sidebar to get started'
          />
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    variant="card"
                    colorId={getColor(note.id)}
                    onOpen={handleOpenNote}
                    onDelete={handleDeleteNote}
                    onColorChange={handleColorChange}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-1">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    variant="list"
                    colorId={getColor(note.id)}
                    onOpen={handleOpenNote}
                    onDelete={handleDeleteNote}
                    onColorChange={handleColorChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
