import {
  Plus,
  DotsThree,
  Trash,
  PencilSimple,
  Palette,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { NOTE_COLORS, getNoteColor, type NoteColorId } from "../../lib/config";
import { formatRelativeTime, extractPreview } from "../../lib/utils";
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
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Get the color based on note metadata (using a custom field or default)
  const colorId = (note as NoteMetadata & { color_id?: string }).color_id;
  const color = getNoteColor(colorId);

  // Extract preview text from content
  const preview = extractPreview(content);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add sub-note or related note functionality
    onOpen(note.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    setShowColorPicker(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(note.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onOpen(note.id);
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(!showColorPicker);
  };

  const handleColorSelect = (e: React.MouseEvent, newColorId: NoteColorId) => {
    e.stopPropagation();
    onColorChange?.(note.id, newColorId);
    setShowColorPicker(false);
    setShowMenu(false);
  };

  return (
    <button
      onClick={() => onOpen(note.id)}
      className="group relative flex flex-col text-left rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:border-ring/30 transition-all duration-200"
      style={{ backgroundColor: color.bg }}
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
          <button
            onClick={handleAddClick}
            className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
            title="Add sub-note"
          >
            <Plus className="w-4 h-4 text-muted-foreground" weight="bold" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
              title="More options"
            >
              <DotsThree
                className="w-4 h-4 text-muted-foreground"
                weight="bold"
              />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <PencilSimple className="w-4 h-4" />
                  Edit note
                </button>
                <div className="relative" ref={colorPickerRef}>
                  <button
                    onClick={handleColorClick}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Palette className="w-4 h-4" />
                    Change color
                  </button>

                  {/* Color Picker */}
                  {showColorPicker && (
                    <div className="absolute left-full top-0 ml-1 w-36 bg-card border border-border rounded-xl shadow-lg z-20 p-2">
                      <div className="grid grid-cols-4 gap-1">
                        {NOTE_COLORS.map((c) => (
                          <button
                            key={c.id}
                            onClick={(e) => handleColorSelect(e, c.id)}
                            className="w-7 h-7 rounded-lg border border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: c.header }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <hr className="my-1 border-border" />
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  Delete note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-4 space-y-3">
        {/* Preview Text */}
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
    </button>
  );
}
