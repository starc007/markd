import { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  DeleteIcon,
  Add01Icon,
  FileEditIcon,
  FolderIcon,
} from "@hugeicons/core-free-icons";
import type { NoteMetadata } from "../../lib/tauri/commands";

import {
  IconButton,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "../ui";
import { ChevronDownIcon } from "../tiptap-icons/chevron-down-icon";
import { ChevronRightIcon } from "../tiptap-icons/chevron-right-icon";

interface NoteListItemProps {
  note: NoteMetadata;
  isActive: boolean;
  onNoteClick: (noteId: string) => void;
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
  onNoteClick,
  onDeleteClick,
  className = "",
  onCreateSubpage,
  isExpanded,
  hasChildren,
  onToggleExpand,
}: NoteListItemProps) {
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
          <div className="w-4 h-4 flex items-center justify-center shrink-0 relative [-webkit-app-region:no-drag]">
            <div className="absolute inset-0 items-center justify-center hidden group-hover:flex transition-opacity duration-200 ease-in-out">
              <IconButton
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(note.id);
                }}
                title={isExpanded ? "Collapse" : "Expand"}
                className="rounded-sm !p-1"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </IconButton>
            </div>
            {/* File/Folder icon - hidden on hover */}
            <div className="block group-hover:hidden transition-opacity duration-200 ease-in-out shrink-0">
              <HugeiconsIcon
                icon={hasChildren ? FolderIcon : FileEditIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.5}
                className="text-muted-foreground"
              />
            </div>
          </div>
        )}
        {/* File/Folder icon for items without children */}
        {!hasChildren && (
          <HugeiconsIcon
            icon={FileEditIcon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
            className="text-muted-foreground shrink-0"
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
