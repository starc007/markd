import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { canJoin } from "@tiptap/pm/transform";
import { TextSelection } from "@tiptap/pm/state";

/**
 * ListNormalization Extension
 *
 * This extension solves the "stuck vertical spacing" problem that occurs when working
 * with lists in Tiptap editor.
 *
 * ## The Problem
 *
 * By default, Tiptap treats each list as a separate structural node. When a user
 * presses Enter twice at the end of a list item, they exit the list and a new
 * paragraph is created between two list blocks:
 *
 * ```html
 * <ul>
 *   <li>Task A</li>
 * </ul>
 *
 * <p></p>   <!-- Empty paragraph created on double-enter -->
 *
 * <ul>
 *   <li>Task B</li>
 * </ul>
 * ```
 *
 * When the user tries to backspace this empty paragraph, Tiptap deletes the paragraph
 * but does NOT automatically merge the two <ul> blocks back into one list. This results
 * in visual "stuck" vertical spacing that users cannot remove, which feels broken.
 */
export const ListNormalizationExtension = Extension.create({
  name: "listNormalization",

  addKeyboardShortcuts() {
    const listTypes = ["bulletList", "orderedList", "taskList"];

    const handleBackspace = ({ editor }: { editor: Editor }) => {
      const { state, view } = editor;
      const { selection } = state;
      const { $from, empty } = selection;

      if (!empty) return false;
      if ($from.parentOffset !== 0) return false;

      const currentNode = $from.parent;

      if (
        currentNode.type.name !== "paragraph" ||
        currentNode.content.size > 0
      ) {
        return false;
      }

      const parentDepth = $from.depth - 1;
      if (parentDepth < 0) return false;

      const parent = $from.node(parentDepth);
      const indexInParent = $from.index(parentDepth);

      if (indexInParent === 0 || indexInParent >= parent.childCount - 1) {
        return false;
      }

      const nodeBefore = parent.child(indexInParent - 1);
      const nodeAfter = parent.child(indexInParent + 1);

      const isBeforeList = listTypes.includes(nodeBefore.type.name);
      const isAfterList = listTypes.includes(nodeAfter.type.name);

      if (!isBeforeList || !isAfterList) {
        return false;
      }

      if (nodeBefore.type.name !== nodeAfter.type.name) {
        return false;
      }

      const startOfPara = $from.before(parentDepth + 1);
      const endOfPara = $from.after(parentDepth + 1);

      const $insideFirstList = state.doc.resolve(startOfPara - 1);
      const targetSelection = TextSelection.findFrom(
        $insideFirstList,
        -1,
        true
      );

      if (!targetSelection) {
        return false;
      }

      const cursorTargetPos = targetSelection.from;

      const tr = state.tr;

      tr.delete(startOfPara, endOfPara);

      if (canJoin(tr.doc, startOfPara)) {
        tr.join(startOfPara);
      }

      const mappedPos = tr.mapping.map(cursorTargetPos);
      tr.setSelection(TextSelection.create(tr.doc, mappedPos));

      view.dispatch(tr);
      return true;
    };

    return {
      Backspace: handleBackspace,
    };
  },
});
