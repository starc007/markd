import { useEffect, useState } from "react";
import {
  MagnifyingGlass,
  Funnel,
  List,
  SquaresFour,
  Plus,
  FileText,
} from "@phosphor-icons/react";
import { useNoteStore } from "../../stores/noteStore";
import { NoteCard } from "./NoteCard";
import type { NoteColorId } from "../../lib/config";

export function NotesGrid() {
  const { notes, folders, ui, loadNotes, loadNote, createNote, deleteNote } =
    useNoteStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (ui.selectedFolderId === null || note.folder_id === ui.selectedFolderId)
  );

  // Create note and immediately open it
  const handleCreateNote = async () => {
    const note = await createNote("Untitled", ui.selectedFolderId || undefined);
    if (note) {
      loadNote(note.id);
    }
  };

  const handleOpenNote = (noteId: string) => {
    loadNote(noteId);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
    }
  };

  const handleColorChange = (noteId: string, colorId: NoteColorId) => {
    // TODO: Implement color change in backend
    console.log("Change color for note", noteId, "to", colorId);
  };

  const currentFolder = ui.selectedFolderId
    ? folders.find((f) => f.id === ui.selectedFolderId)
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-sidebar">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 text-sm">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">
            {currentFolder?.name || "All notes"}
          </span>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search a note"
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground bg-background border border-border rounded-xl hover:border-ring/50 transition-all">
          <Funnel className="w-4 h-4" />
          Filters
        </button>
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 transition-colors ${
              viewMode === "list"
                ? "bg-accent"
                : "bg-background hover:bg-accent"
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-colors ${
              viewMode === "grid"
                ? "bg-accent"
                : "bg-background hover:bg-accent"
            }`}
            title="Grid view"
          >
            <SquaresFour className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Grid/List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No notes yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first note to get started
            </p>
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Note
            </button>
          </div>
        ) : (
          <>
            {/* Create Note Button */}
            <div className="mb-4">
              <button
                onClick={handleCreateNote}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Note
              </button>
            </div>

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onOpen={handleOpenNote}
                    onDelete={handleDeleteNote}
                    onColorChange={handleColorChange}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
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
