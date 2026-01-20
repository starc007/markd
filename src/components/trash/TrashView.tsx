import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";
import { EmptyState } from "../ui";
import { TrashItem } from "./TrashItem";
import { Virtuoso } from "react-virtuoso";

export function TrashView() {
    const { trashedNotes, isLoadingTrash, loadTrashedNotes } = useNoteStore();

    useEffect(() => {
        loadTrashedNotes();
    }, [loadTrashedNotes]);

    if (isLoadingTrash) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading trash...</div>
            </div>
        );
    }

    if (trashedNotes.length === 0) {
        return (
            <EmptyState
                icon={
                    <HugeiconsIcon
                        icon={Delete02Icon}
                        size={48}
                        color="currentColor"
                        strokeWidth={1.5}
                    />
                }
                title="Trash is empty"
                description="Deleted notes will appear here and be automatically deleted after 7 days."
            />
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border">
                <h1 className="text-xl font-semibold text-foreground">Trash</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {trashedNotes.length}{" "}
                    {trashedNotes.length === 1 ? "note" : "notes"} in trash
                </p>
            </div>

            <div className="flex-1 overflow-hidden">
                <Virtuoso
                    data={trashedNotes}
                    itemContent={(_index, note) => (
                        <div className="px-6 py-2">
                            <TrashItem key={note.id} note={note} />
                        </div>
                    )}
                    style={{ height: "100%" }}
                />
            </div>
        </div>
    );
}
