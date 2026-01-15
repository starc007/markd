import React from "react";
import { Editor } from "@tiptap/react";
import { AddRowTopIcon } from "../../tiptap-icons/add-row-top-icon";
import { AddRowBottomIcon } from "../../tiptap-icons/add-row-bottom-icon";
import { AddColLeftIcon } from "../../tiptap-icons/add-col-left-icon";
import { AddColRightIcon } from "../../tiptap-icons/add-col-right-icon";
import { TrashIcon } from "../../tiptap-icons/trash-icon";
import { TableHeaderRowIcon } from "../../tiptap-icons/table-header-row-icon";
import { cn } from "../../../lib/utils";

interface TableControlsProps {
  editor: Editor;
}

const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  {
    onClick: () => void;
    isActive?: boolean;
    ariaLabel: string;
    children: React.ReactNode;
    disabled?: boolean;
  }
>(({ onClick, isActive, ariaLabel, children, disabled }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "p-2 rounded transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
});

ToolbarButton.displayName = "ToolbarButton";

export function TableControls({ editor }: TableControlsProps) {
  const canAddRowBefore = editor.can().addRowBefore();
  const canAddRowAfter = editor.can().addRowAfter();
  const canAddColumnBefore = editor.can().addColumnBefore();
  const canAddColumnAfter = editor.can().addColumnAfter();
  const canDeleteRow = editor.can().deleteRow();
  const canDeleteColumn = editor.can().deleteColumn();
  const canDeleteTable = editor.can().deleteTable();
  const canToggleHeaderRow = editor.can().toggleHeaderRow();

  return (
    <div className="flex items-center gap-1">
      <div className="w-px h-6 bg-border mx-1" />

      {/* Row controls */}
      <ToolbarButton
        onClick={() => editor.chain().focus().addRowBefore().run()}
        ariaLabel="Add row above"
        disabled={!canAddRowBefore}
      >
        <AddRowTopIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().addRowAfter().run()}
        ariaLabel="Add row below"
        disabled={!canAddRowAfter}
      >
        <AddRowBottomIcon className="w-4 h-4" />
      </ToolbarButton>

      {/* Column controls */}
      <ToolbarButton
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        ariaLabel="Add column left"
        disabled={!canAddColumnBefore}
      >
        <AddColLeftIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        ariaLabel="Add column right"
        disabled={!canAddColumnAfter}
      >
        <AddColRightIcon className="w-4 h-4" />
      </ToolbarButton>

      {/* Header toggle */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        ariaLabel="Toggle header row"
        isActive={editor.isActive("tableHeader")}
        disabled={!canToggleHeaderRow}
      >
        <TableHeaderRowIcon className="w-4 h-4" />
      </ToolbarButton>

      {/* Delete controls */}
      <div className="w-px h-6 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().deleteRow().run()}
        ariaLabel="Delete row"
        disabled={!canDeleteRow}
      >
        <TrashIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().deleteColumn().run()}
        ariaLabel="Delete column"
        disabled={!canDeleteColumn}
      >
        <TrashIcon className="w-4 h-4 rotate-90" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().deleteTable().run()}
        ariaLabel="Delete table"
        disabled={!canDeleteTable}
      >
        <TrashIcon className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}
