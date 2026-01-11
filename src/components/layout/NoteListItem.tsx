import { memo } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  DeleteIcon,
  Tick02Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import type { NoteMetadata } from "../../lib/tauri/commands";
import { getNoteColor, NOTE_COLORS } from "../../lib/config";
import type { NoteColorId } from "../../lib/config";
import {
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "../ui";
import { ChevronDownIcon } from "../tiptap-icons/chevron-down-icon";
import { ChevronRightIcon } from "../tiptap-icons/chevron-right-icon";

interface NoteListItemProps {
  note: NoteMetadata;
  isActive: boolean;
  colorId: NoteColorId;
  onNoteClick: (noteId: string) => void;
  onColorSelect: (
    noteId: string,
    colorId: NoteColorId,
    e: React.MouseEvent
  ) => void;
  onDeleteClick: (noteId: string) => void;
  className?: string;
  onCreateSubpage: (parentId: string) => void;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggleExpand: (pageId: string) => void;
}

export const NoteListItem = memo(function NoteListItem({
  note,
  isActive,
  colorId,
  onNoteClick,
  onColorSelect,
  onDeleteClick,
  className = "",
  onCreateSubpage,
  isExpanded,
  hasChildren,
  onToggleExpand,
}: NoteListItemProps) {
  const color = getNoteColor(colorId);

  return (
    <div className={`group relative ${className}`}>
      <button
        onClick={() => onNoteClick(note.id)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all duration-200 ease-in-out [-webkit-app-region:no-drag] ${
          isActive
            ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent text-sidebar-sidebar-foreground"
        }`}
      >
        {/* Toggle button - shown on hover, replaces color indicator */}
        {hasChildren && (
          <div className="w-1 h-5 flex items-center justify-center shrink-0 relative [-webkit-app-region:no-drag]">
            <div className="absolute inset-0 items-center justify-center hidden group-hover:flex transition-opacity duration-200 ease-in-out">
              <IconButton
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(note.id);
                }}
                title={isExpanded ? "Collapse" : "Expand"}
                className="rounded-sm !p-1 ml-1"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </IconButton>
            </div>
            {/* Color indicator - hidden on hover */}
            <div
              className="w-1 h-5 rounded-full shrink-0 block group-hover:hidden transition-opacity duration-200 ease-in-out"
              style={{ backgroundColor: color.darkHeader }}
            />
          </div>
        )}
        {/* Color indicator for items without children */}
        {!hasChildren && (
          <div
            className="w-1 h-5 rounded-full shrink-0"
            style={{ backgroundColor: color.darkHeader }}
          />
        )}
        <div className="flex-1 min-w-0 pl-1.5">
          <div
            className={`text-sm font-medium truncate ${
              isActive ? "text-accent-foreground" : "text-foreground"
            }`}
          >
            {note.title || "Untitled"}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out shrink-0 [-webkit-app-region:no-drag]">
            <IconButton
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCreateSubpage(note.id);
              }}
              title="Create sub-page"
              className="!p-1 rounded-sm"
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.5}
              />
            </IconButton>
          </div>
          {/* Dropdown Menu */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out shrink-0 [-webkit-app-region:no-drag]">
            <Dropdown>
              <DropdownTrigger>
                <IconButton
                  onClick={(e) => e.stopPropagation()}
                  size="sm"
                  title="More options"
                  className="!p-1 rounded-sm"
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
                        onClick={(e) => onColorSelect(note.id, c.id, e)}
                        className="w-5 h-5 rounded-md border border-border/50 hover:border-ring/50 flex items-center justify-center"
                        style={{ backgroundColor: c.darkHeader }}
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
                    onDeleteClick(note.id);
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
          </div>
        </div>
      </button>
    </div>
  );
});
