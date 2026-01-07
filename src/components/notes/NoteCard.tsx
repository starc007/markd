import { motion } from "framer-motion";
import { DotsThree, Trash, PencilSimple, Check } from "@phosphor-icons/react";
import { useState } from "react";
import { NOTE_COLORS, getNoteColor, type NoteColorId } from "../../lib/config";
import { formatRelativeTime, extractPreview } from "../../lib/utils";
import {
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  Modal,
  ModalFooter,
  Button,
} from "../ui";
import type { NoteMetadata } from "../../lib/tauri/commands";

interface NoteCardProps {
  note: NoteMetadata;
  content?: string;
  colorId?: NoteColorId;
  onOpen: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onColorChange?: (noteId: string, colorId: NoteColorId) => void;
}

export function NoteCard({
  note,
  content = "",
  colorId = "default",
  onOpen,
  onDelete,
  onColorChange,
}: NoteCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const color = getNoteColor(colorId);
  const preview = extractPreview(content);

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
            <Dropdown>
              <DropdownTrigger>
                <IconButton
                  onClick={(e) => e.stopPropagation()}
                  size="sm"
                  title="More options"
                >
                  <DotsThree className="w-4 h-4" weight="bold" />
                </IconButton>
              </DropdownTrigger>

              <DropdownContent align="end" className="w-48">
                <DropdownItem onClick={handleEditClick}>
                  <PencilSimple className="w-4 h-4 text-muted-foreground" />
                  Edit note
                </DropdownItem>

                <DropdownSeparator />

                {/* Color Picker Section */}
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
                          <Check
                            className="w-3 h-3 text-foreground/70"
                            weight="bold"
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
                  <Trash className="w-4 h-4" />
                  Delete note
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 p-4 space-y-3">
          {preview ? (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {preview}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Note"
      >
        <p className="text-muted-foreground">
          Are you sure you want to delete "{note.title || "Untitled"}"? This
          action cannot be undone.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
