import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, Plus } from "@hugeicons/core-free-icons";

import { StickyNote } from "@/features/sticky-notes/components/StickyNote";
import { Button, EmptyState } from "@/components/ui";
import { useStickyNotesStore } from "@/features/sticky-notes/stores/stickyNotesStore";
import { useUIStore } from "@/stores/uiStore";

export function StickyNotesGrid() {
  const {
    stickyNotes,
    createStickyNote,
    updateStickyNote,
    deleteStickyNote,
    loadStickyNotes,
  } = useStickyNotesStore();

  const selectedStickyNoteId = useUIStore(
    (state) => state.selectedStickyNoteId
  );

  useEffect(() => {
    loadStickyNotes();
  }, [loadStickyNotes]);

  const handleCreateStickyNote = async () => {
    await createStickyNote();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Draggable region for macOS */}
      <div
        className="h-[50px] shrink-0 flex items-center justify-between px-6"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-2 text-sm [-webkit-app-region:no-drag]">
          <span className="font-medium">Sticky Notes</span>
        </div>
        {/* <button
          onClick={handleCreateStickyNote}
          className="px-3 py-1.5 text-sm bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg transition-colors [-webkit-app-region:no-drag]"
        >
          New Sticky Note
        </button> */}
        <Button variant="secondary" onClick={handleCreateStickyNote}>
          <HugeiconsIcon
            icon={Plus}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
          />
          New Sticky Note
        </Button>
      </div>

      {/* Sticky Notes Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4 border-t border-sidebar-border">
        {stickyNotes.length === 0 ? (
          <EmptyState
            icon={
              <HugeiconsIcon
                icon={File02Icon}
                size={60}
                color="currentColor"
                strokeWidth={1.5}
              />
            }
            title="No sticky notes yet"
            description="Create a sticky note to get started"
            action={
              <Button variant="secondary" onClick={handleCreateStickyNote}>
                <HugeiconsIcon
                  icon={Plus}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                New Sticky Note
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stickyNotes.map((stickyNote) => (
              <StickyNote
                key={stickyNote.id}
                selected={selectedStickyNoteId === stickyNote.id}
                stickyNote={stickyNote}
                onUpdate={updateStickyNote}
                onDelete={deleteStickyNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
