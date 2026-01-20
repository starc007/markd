import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { DeleteIcon } from "@hugeicons/core-free-icons";
import { Undo2Icon } from "../tiptap-icons/undo2-icon";
import type { TrashedNoteMetadata } from "../../lib/tauri/commands";
import { useNoteStore } from "../../stores/noteStore";
import { IconButton, Modal, ModalFooter, Button } from "../ui";
import { formatRelativeTime } from "../../lib/utils";

interface TrashItemProps {
    note: TrashedNoteMetadata;
}

export function TrashItem({ note }: TrashItemProps) {
    const { restoreNote, permanentlyDeleteNote } = useNoteStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            await restoreNote(note.id);
        } catch (error) {
            console.error("Failed to restore note:", error);
        } finally {
            setIsRestoring(false);
        }
    };

    const handlePermanentDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmPermanentDelete = async () => {
        setShowDeleteModal(false);
        setIsDeleting(true);
        try {
            await permanentlyDeleteNote(note.id);
        } catch (error) {
            console.error("Failed to permanently delete note:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const isExpiringSoon = note.days_until_deletion <= 2;
    const isExpired = note.days_until_deletion <= 0;

    return (
        <div className="group relative border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">
                            {note.title || "Untitled"}
                        </h3>
                        {isExpiringSoon && !isExpired && (
                            <span
                                className="text-yellow-500 shrink-0 text-xs font-medium"
                                title="Expiring soon"
                            >
                                ⚠️
                            </span>
                        )}
                    </div>
                    {note.preview && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {note.preview}
                        </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                            Deleted {formatRelativeTime(note.deleted_at)}
                        </span>
                        {!isExpired && (
                            <span
                                className={
                                    isExpiringSoon
                                        ? "text-yellow-500 font-medium"
                                        : "text-muted-foreground"
                                }
                            >
                                {note.days_until_deletion === 1
                                    ? "Expires in 1 day"
                                    : `Expires in ${note.days_until_deletion} days`}
                            </span>
                        )}
                        {isExpired && (
                            <span className="text-red-500 font-medium">
                                Expired - will be deleted soon
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <IconButton
                        size="sm"
                        onClick={handleRestore}
                        disabled={isRestoring || isDeleting}
                        title="Restore note"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Undo2Icon className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                        size="sm"
                        onClick={handlePermanentDeleteClick}
                        disabled={isRestoring || isDeleting}
                        title="Permanently delete"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                        <HugeiconsIcon
                            icon={DeleteIcon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.5}
                        />
                    </IconButton>
                </div>
            </div>

            {/* Permanent Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Permanently Delete Note"
            >
                <p className="text-muted-foreground">
                    Are you sure you want to permanently delete "{note.title || "Untitled"}"?
                    This action cannot be undone and the note will be immediately removed from your trash.
                </p>
                <ModalFooter>
                    <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirmPermanentDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Permanently"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
