import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  DeleteIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
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
import type { StickyNote as StickyNoteType } from "../../stores/stickyNotesStore";

interface StickyNoteProps {
  stickyNote: StickyNoteType;
  onUpdate: (
    id: string,
    updates: Partial<Pick<StickyNoteType, "content" | "colorId">>
  ) => void;
  onDelete: (id: string) => void;
}

export function StickyNote({
  stickyNote,
  onUpdate,
  onDelete,
}: StickyNoteProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const color = getNoteColor(stickyNote.colorId);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
      adjustTextareaHeight();
    }
  }, [isEditing, adjustTextareaHeight]);

  useEffect(() => {
    if (textareaRef.current && !isEditing) {
      adjustTextareaHeight();
    }
  }, [stickyNote.content, isEditing, adjustTextareaHeight]);

  const handleContentChange = (newContent: string) => {
    onUpdate(stickyNote.id, { content: newContent });
    // Adjust height after content change
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  const handleColorSelect = (e: React.MouseEvent, newColorId: NoteColorId) => {
    e.stopPropagation();
    onUpdate(stickyNote.id, { colorId: newColorId });
  };

  const handleDeleteConfirm = () => {
    onDelete(stickyNote.id);
    setShowDeleteModal(false);
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
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
                {stickyNote.colorId === c.id && (
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
          Delete
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );

  return (
    <>
      <motion.div
        className="group relative flex flex-col rounded-xl text-left overflow-hidden border border-border"
        style={{ backgroundColor: color.bg }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        onClick={handleClick}
      >
        {/* Card Header */}

        {/* Content - Textarea */}
        <div className="flex-1 p-4">
          <textarea
            ref={textareaRef}
            value={stickyNote.content}
            onChange={(e) => {
              handleContentChange(e.target.value);
              adjustTextareaHeight();
            }}
            onInput={adjustTextareaHeight}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-black resize-none outline-none placeholder:text-muted-foreground/50"
            placeholder="Write your note here..."
            style={{
              fontFamily: "inherit",
              minHeight: "120px",
              height: "auto",
              overflow: "hidden",
            }}
            rows={1}
          />
        </div>
        <div
          className="px-4 py-1 flex items-center justify-between"
          style={{ backgroundColor: color.header }}
        >
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(stickyNote.updatedAt)}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {DropdownMenu}
          </div>
        </div>
      </motion.div>

      <DeleteNoteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        noteTitle="this sticky note"
      />
    </>
  );
}
