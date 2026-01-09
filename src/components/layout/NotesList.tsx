import { Virtuoso } from "react-virtuoso";
import type { NoteMetadata } from "../../lib/tauri/commands";
import { NoteListItem } from "./NoteListItem";
import { SectionHeading } from "../ui";
import type { NoteColorId } from "../../lib/config";

interface NotesListProps {
  notes: NoteMetadata[];
  currentNoteId: string | null;
  getColor: (noteId: string) => NoteColorId;
  onNoteClick: (noteId: string) => void;
  onColorSelect: (
    noteId: string,
    colorId: NoteColorId,
    e: React.MouseEvent
  ) => void;
  onDeleteClick: (noteId: string) => void;
}

export function NotesList({
  notes,
  currentNoteId,
  getColor,
  onNoteClick,
  onColorSelect,
  onDeleteClick,
}: NotesListProps) {
  const useVirtualization = notes.length > 50;

  if (notes.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2">
          <SectionHeading>Notes</SectionHeading>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground text-center">
            No notes yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <SectionHeading>Notes</SectionHeading>
      </div>
      <div className="flex-1 overflow-hidden">
        {useVirtualization ? (
          <Virtuoso
            data={notes}
            itemContent={(_index, note) => {
              const isActive = currentNoteId === note.id;
              const colorId = getColor(note.id);
              return (
                <div className="px-3 pb-1">
                  <NoteListItem
                    note={note}
                    isActive={isActive}
                    colorId={colorId}
                    onNoteClick={onNoteClick}
                    onColorSelect={onColorSelect}
                    onDeleteClick={onDeleteClick}
                  />
                </div>
              );
            }}
            style={{ height: "100%" }}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {notes.map((note) => {
              const isActive = currentNoteId === note.id;
              const colorId = getColor(note.id);
              return (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isActive={isActive}
                  colorId={colorId}
                  onNoteClick={onNoteClick}
                  onColorSelect={onColorSelect}
                  onDeleteClick={onDeleteClick}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
