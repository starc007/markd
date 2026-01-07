import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  DeleteIcon,
  EditIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { NOTE_COLORS, getNoteColor, type NoteColorId } from "../../lib/config";
import { formatRelativeTime } from "../../lib/utils";
import {
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "../ui";
import { DeleteNoteModal } from "./DeleteNoteModal";
import type { NoteMetadata } from "../../lib/tauri/commands";

interface NoteCardProps {
  note: NoteMetadata;
  colorId?: NoteColorId;
  variant?: "card" | "list";
  onOpen: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onColorChange?: (noteId: string, colorId: NoteColorId) => void;
}

export function NoteCard({
  note,
  colorId = "default",
  variant = "card",
  onOpen,
  onDelete,
  onColorChange,
}: NoteCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const color = getNoteColor(colorId);

  const handleEditClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onOpen(note.id);
  };

  const handleDeleteConfirm = () => {
    onDelete(note.id);
    setShowDeleteModal(false);
  };

  const handleColorSelect = (e: React.MouseEvent, newColorId: NoteColorId) => {
    e.stopPropagation();
    onColorChange?.(note.id, newColorId);
  };

  const DropdownMenu = (
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
        <DropdownItem onClick={handleEditClick}>
          <HugeiconsIcon
            icon={EditIcon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
            className="text-muted-foreground"
          />
          Edit note
        </DropdownItem>

        <DropdownSeparator />

        <DropdownLabel>Background Color</DropdownLabel>
        <div className="px-2 pb-2" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-7 gap-1">
            {NOTE_COLORS.map((c) => (
              <motion.button
                key={c.id}
                onClick={(e) => handleColorSelect(e, c.id)}
                className="w-5 h-5 rounded-md border border-border/50 hover:border-ring/50 flex items-center justify-center"
                style={{ backgroundColor: c.header }}
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
            setShowDeleteModal(true);
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
  );

  // List View
  if (variant === "list") {
    return (
      <>
        <motion.button
          onClick={() => onOpen(note.id)}
          className="group w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl border border-border hover:bg-accent/50 transition-colors"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.15 }}
        >
          {/* Color indicator */}
          <div
            className="w-1 h-10 rounded-full shrink-0"
            style={{ backgroundColor: color.header }}
          />

          {/* Title & Preview */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {note.title || "Untitled"}
            </h3>
            {note.preview && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {note.preview}
              </p>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeTime(note.updated_at)}
          </span>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {DropdownMenu}
          </div>
        </motion.button>

        <DeleteNoteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          noteTitle={note.title}
        />
      </>
    );
  }

  // Card View (default)
  return (
    <>
      <motion.button
        onClick={() => onOpen(note.id)}
        className="group relative flex flex-col text-left rounded-xl overflow-hidden border border-border"
        style={{ backgroundColor: color.bg }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
      >
        {/* Card Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: color.header }}
        >
          <h3 className="font-semibold text-foreground truncate pr-2">
            {note.title || "Untitled"}
          </h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {DropdownMenu}
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 p-4 space-y-3">
          {note.preview ? (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {note.preview}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">
              Click to start writing...
            </p>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border/50">
          {formatRelativeTime(note.updated_at)}
        </div>
      </motion.button>

      <DeleteNoteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        noteTitle={note.title}
      />
    </>
  );
}
