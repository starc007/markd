import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { useNoteStore } from "../../stores/noteStore";
import { EmptyState, Button, Modal, ModalFooter } from "../ui";
import { TrashItem } from "./TrashItem";
import { Virtuoso } from "react-virtuoso";

export function TrashView() {
    const { trashedNotes, isLoadingTrash, loadTrashedNotes, permanentlyDeleteAllTrashedNotes } = useNoteStore();
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    useEffect(() => {
        loadTrashedNotes();
    }, [loadTrashedNotes]);

    const handleDeleteAll = async () => {
        setShowDeleteAllModal(false);
        setIsDeletingAll(true);
        try {
            await permanentlyDeleteAllTrashedNotes();
        } catch (error) {
            console.error("Failed to delete all notes:", error);
        } finally {
            setIsDeletingAll(false);
        }
    };

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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Trash</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {trashedNotes.length}{" "}
                            {trashedNotes.length === 1 ? "note" : "notes"} in trash
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDeleteAllModal(true)}
                        disabled={isDeletingAll || trashedNotes.length === 0}
                    >
                        <HugeiconsIcon
                            icon={Delete02Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.5}
                        />
                        Delete All
                    </Button>
                </div>
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

            {/* Delete All Confirmation Modal */}
            <Modal
                isOpen={showDeleteAllModal}
                onClose={() => setShowDeleteAllModal(false)}
                title="Delete All Notes from Trash"
            >
                <p className="text-muted-foreground">
                    Are you sure you want to permanently delete all {trashedNotes.length}{" "}
                    {trashedNotes.length === 1 ? "note" : "notes"} from trash?
                    This action cannot be undone and all notes will be immediately removed.
                </p>
                <ModalFooter>
                    <Button variant="ghost" onClick={() => setShowDeleteAllModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteAll}
                        disabled={isDeletingAll}
                    >
                        {isDeletingAll ? "Deleting..." : "Delete All"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
