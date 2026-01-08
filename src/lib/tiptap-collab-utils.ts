import { CellSelection } from "@tiptap/pm/tables";
import {
  Editor,
  isNodeSelection,
  isTextSelection,
  posToDOMRect,
} from "@tiptap/react";

export type OverflowPosition = "none" | "top" | "bottom" | "both";
/**
 * Get the overflow position of an element relative to its container
 */
export function getElementOverflowPosition(
  targetElement: Element,
  containerElement: HTMLElement
): OverflowPosition {
  const targetBounds = targetElement.getBoundingClientRect();
  const containerBounds = containerElement.getBoundingClientRect();

  const isOverflowingTop = targetBounds.top < containerBounds.top;
  const isOverflowingBottom = targetBounds.bottom > containerBounds.bottom;

  if (isOverflowingTop && isOverflowingBottom) return "both";
  if (isOverflowingTop) return "top";
  if (isOverflowingBottom) return "bottom";
  return "none";
}

export const getSelectionBoundingRect = (editor: Editor): DOMRect | null => {
  const { state } = editor.view;
  const { selection } = state;
  const { ranges } = selection;

  const from = Math.min(...ranges.map((range) => range.$from.pos));
  const to = Math.max(...ranges.map((range) => range.$to.pos));

  if (isNodeSelection(selection)) {
    const node = editor.view.nodeDOM(from) as HTMLElement;
    if (node) {
      return node.getBoundingClientRect();
    }
  }

  return posToDOMRect(editor.view, from, to);
};

export const isSelectionValid = (
  editor: Editor | null,
  selection?: Editor["state"]["selection"],
  excludedNodeTypes: string[] = ["imageUpload", "horizontalRule"]
): boolean => {
  if (!editor) return false;
  if (!selection) selection = editor.state.selection;

  const { state } = editor;
  const { doc } = state;
  const { empty, from, to } = selection;

  const isEmptyTextBlock =
    !doc.textBetween(from, to).length && isTextSelection(selection);
  const isCodeBlock =
    selection.$from.parent.type.spec.code ||
    (isNodeSelection(selection) && selection.node.type.spec.code);
  const isExcludedNode =
    isNodeSelection(selection) &&
    excludedNodeTypes.includes(selection.node.type.name);
  const isTableCell = selection instanceof CellSelection;

  return (
    !empty &&
    !isEmptyTextBlock &&
    !isCodeBlock &&
    !isExcludedNode &&
    !isTableCell
  );
};
