import { motion, AnimatePresence } from "framer-motion";
import { DotsThree, Trash, PencilSimple, Palette } from "@phosphor-icons/react";
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
} from "../ui";
import type { NoteMetadata } from "../../lib/tauri/commands";

interface NoteCardProps {
  note: NoteMetadata;
  content?: string;
  onOpen: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onColorChange?: (noteId: string, colorId: NoteColorId) => void;
}

export function NoteCard({
  note,
  content = "",
  onOpen,
  onDelete,
  onColorChange,
}: NoteCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Get the color based on note metadata
  const colorId = (note as NoteMetadata & { color_id?: string }).color_id;
  const color = getNoteColor(colorId);

  // Extract preview text from content
  const preview = extractPreview(content);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen(note.id);
  };

  const handleColorSelect = (e: React.MouseEvent, newColorId: NoteColorId) => {
    e.stopPropagation();
    onColorChange?.(note.id, newColorId);
    setShowColorPicker(false);
  };

  return (
    <motion.button
      onClick={() => onOpen(note.id)}
      className="group relative flex flex-col text-left rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:border-ring/30 transition-shadow duration-200"
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

            <DropdownContent align="end">
              <DropdownItem onClick={handleEditClick}>
                <PencilSimple className="w-4 h-4 text-muted-foreground" />
                Edit note
              </DropdownItem>

              <div className="relative">
                <DropdownItem
                  onClick={(e) => {
                    e?.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                >
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  Change color
                </DropdownItem>

                {/* Color Picker Submenu */}
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.1 }}
                      className="absolute left-full top-0 ml-1 w-[140px] bg-card border border-border rounded-xl shadow-lg z-30 p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-4 gap-1.5">
                        {NOTE_COLORS.map((c) => (
                          <motion.button
                            key={c.id}
                            onClick={(e) => handleColorSelect(e, c.id)}
                            className="w-7 h-7 rounded-lg border border-border/50 hover:border-ring/50"
                            style={{ backgroundColor: c.header }}
                            title={c.name}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DropdownSeparator />

              <DropdownItem onClick={handleDeleteClick} variant="destructive">
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
  );
}
