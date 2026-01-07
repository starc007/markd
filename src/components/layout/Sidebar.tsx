import { useEffect, useState } from "react";
import { useNoteStore } from "../../stores/noteStore";
import type { NoteMetadata, Folder } from "../../lib/tauri/commands";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NoteItemProps {
  note: NoteMetadata;
  isActive: boolean;
  onClick: () => void;
}

function NoteItem({ note, isActive, onClick }: NoteItemProps) {
  return (
    <button
      onClick={onClick}
      className={`note-item ${isActive ? "active" : ""}`}
    >
      <div className="note-item-title">{note.title || "Untitled"}</div>
      <div className="note-item-date">{formatDate(note.updated_at)}</div>
    </button>
  );
}

interface FolderItemProps {
  folder: Folder;
  isActive: boolean;
  noteCount: number;
  onClick: () => void;
}

function FolderItem({ folder, isActive, noteCount, onClick }: FolderItemProps) {
  return (
    <button
      onClick={onClick}
      className={`folder-item ${isActive ? "active" : ""}`}
    >
      <svg className="folder-icon" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
      <span className="folder-name">{folder.name}</span>
      <span className="folder-count">{noteCount}</span>
    </button>
  );
}

export function Sidebar() {
  const {
    notes,
    folders,
    currentNote,
    ui,
    loadNotes,
    loadNote,
    loadFolders,
    createNote,
    selectFolder,
  } = useNoteStore();

  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  useEffect(() => {
    loadFolders();
    loadNotes();
  }, []);

  const handleCreateNote = async () => {
    if (isCreatingNote) {
      if (newNoteTitle.trim()) {
        await createNote(newNoteTitle.trim(), ui.selectedFolderId || undefined);
        setNewNoteTitle("");
      }
      setIsCreatingNote(false);
    } else {
      setIsCreatingNote(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateNote();
    } else if (e.key === "Escape") {
      setIsCreatingNote(false);
      setNewNoteTitle("");
    }
  };

  const getNoteCountForFolder = (folderId: string | null) => {
    return notes.filter((n) => n.folder_id === folderId).length;
  };

  if (ui.sidebarCollapsed) {
    return null;
  }

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h1 className="sidebar-title">Draft</h1>
        <button
          onClick={handleCreateNote}
          className="new-note-button"
          title="New note (⌘N)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* New note input */}
      {isCreatingNote && (
        <div className="new-note-input-container">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newNoteTitle.trim()) {
                setIsCreatingNote(false);
              }
            }}
            placeholder="Note title..."
            className="new-note-input"
            autoFocus
          />
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Folders</div>
          <div className="folder-list">
            <button
              onClick={() => selectFolder(null)}
              className={`folder-item ${
                ui.selectedFolderId === null ? "active" : ""
              }`}
            >
              <svg
                className="folder-icon"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="folder-name">All Notes</span>
              <span className="folder-count">{notes.length}</span>
            </button>
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                isActive={ui.selectedFolderId === folder.id}
                noteCount={getNoteCountForFolder(folder.id)}
                onClick={() => selectFolder(folder.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="sidebar-section notes-section">
        <div className="sidebar-section-title">
          {ui.selectedFolderId
            ? folders.find((f) => f.id === ui.selectedFolderId)?.name || "Notes"
            : "All Notes"}
        </div>
        <div className="note-list">
          {notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes yet</p>
              <button
                onClick={() => setIsCreatingNote(true)}
                className="empty-state-button"
              >
                Create your first note
              </button>
            </div>
          ) : (
            notes
              .filter(
                (note) =>
                  ui.selectedFolderId === null ||
                  note.folder_id === ui.selectedFolderId
              )
              .map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isActive={currentNote?.id === note.id}
                  onClick={() => loadNote(note.id)}
                />
              ))
          )}
        </div>
      </div>
    </aside>
  );
}
