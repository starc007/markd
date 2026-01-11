import { useMemo } from "react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { UiState } from "../../../lib/tiptap-extension/ui-state-extension";
import { NodeAlignment } from "../../../lib/tiptap-extension/node-alignment-extension";
import { NodeBackground } from "../../../lib/tiptap-extension/node-background-extension";
import { ListNormalizationExtension } from "../../../lib/tiptap-extension/list-normalization-extension";
import { PageLinkExtension } from "../../../lib/tiptap-extension/page-link-extension";
import { BookmarkLinkExtension } from "@/lib/tiptap-extension/bookmark-link-extension";

/**
 * Parse content safely, returning default doc if invalid
 */
export function parseContent(content: string) {
  if (!content || content.trim() === "") {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse note content:", e);
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
}

/**
 * Get TipTap editor extensions configuration
 */
export function useEditorConfig() {
  return useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      UiState,
      NodeAlignment,
      NodeBackground,
      ListNormalizationExtension,
      PageLinkExtension.configure({
        HTMLAttributes: {
          class: "page-link",
        },
      }),
      BookmarkLinkExtension.configure({
        HTMLAttributes: {
          class: "bookmark-link",
        },
      }),
    ],
    []
  );
}
