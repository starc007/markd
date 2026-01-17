import { useMemo, memo } from "react";
import { Virtuoso } from "react-virtuoso";

import type { NoteMetadata } from "../../lib/tauri/commands";
import { NoteListItem } from "./NoteListItem";
import { SectionHeading } from "../ui";

interface HierarchicalNote extends NoteMetadata {
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface HierarchicalNotesListProps {
  notes: NoteMetadata[];
  childrenMap: Map<string, NoteMetadata[]>;
  expandedPages: Set<string>;
  currentNoteId: string | null;
  onNoteClick: (noteId: string) => void;
  onDeleteClick: (noteId: string) => void;
  onToggleExpand: (pageId: string) => void;
  onCreateSubpage: (parentId: string) => void;
}

// Flatten hierarchy into a flat list with depth information
function flattenHierarchy(
  notes: NoteMetadata[],
  childrenMap: Map<string, NoteMetadata[]>,
  expandedPages: Set<string>,
  depth: number = 0
): HierarchicalNote[] {
  const result: HierarchicalNote[] = [];

  for (const note of notes) {
    const hasChildren = note.children_count > 0;
    const isExpanded = expandedPages.has(note.id);
    const children = isExpanded ? childrenMap.get(note.id) || [] : [];

    result.push({
      ...note,
      depth,
      hasChildren,
      isExpanded,
    });

    // Recursively add children if expanded
    if (isExpanded && children.length > 0) {
      result.push(
        ...flattenHierarchy(children, childrenMap, expandedPages, depth + 1)
      );
    }
  }

  return result;
}

export const HierarchicalNotesList = memo(function HierarchicalNotesList({
  notes,
  childrenMap,
  expandedPages,
  currentNoteId,
  onNoteClick,
  onDeleteClick,
  onToggleExpand,
  onCreateSubpage,
}: HierarchicalNotesListProps) {
  const flatNotes = useMemo(
    () => flattenHierarchy(notes, childrenMap, expandedPages),
    [notes, childrenMap, expandedPages]
  );

  const useVirtualization = flatNotes.length > 50;

  if (notes.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2">
          <SectionHeading>Notes</SectionHeading>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground text-center">
            No notes yet
          </p>
        </div>
      </div>
    );
  }

  const renderNote = (note: HierarchicalNote, _index?: number) => {
    const isActive = currentNoteId === note.id;
    const indent = note.depth * 16; // 16px per level

    return (
      <div
        key={note.id}
        className="group relative flex items-center gap-1"
        style={{ paddingLeft: `${indent}px` }}
      >
        {/* Note item */}
        <div className="flex-1 min-w-0">
          <NoteListItem
            note={note}
            isActive={isActive}
            onNoteClick={onNoteClick}
            onDeleteClick={onDeleteClick}
            onCreateSubpage={onCreateSubpage}
            isExpanded={note.isExpanded}
            onToggleExpand={onToggleExpand}
            hasChildren={note.hasChildren}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <SectionHeading>Notes</SectionHeading>
      </div>
      <div className="flex-1 overflow-hidden">
        {useVirtualization ? (
          <Virtuoso
            key="hierarchical-notes-list"
            data={flatNotes}
            itemContent={(_index, note) => {
              return <div className="px-3 pb-1">{renderNote(note)}</div>;
            }}
            style={{ height: "100%" }}
            followOutput="smooth"
            increaseViewportBy={200}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {flatNotes.map((note) => renderNote(note))}
          </div>
        )}
      </div>
    </div>
  );
});
