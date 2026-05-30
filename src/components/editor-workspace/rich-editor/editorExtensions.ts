import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { WikiLinkExtension } from "./wikiLinkExtension";

const WorkspaceImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      workspaceSrc: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-workspace-src"),
        renderHTML: (attributes) =>
          attributes.workspaceSrc
            ? { "data-workspace-src": attributes.workspaceSrc }
            : {},
      },
    };
  },
});

const FormattingShortcuts = Extension.create({
  name: "formattingShortcuts",
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      "Mod-b": () => this.editor.commands.toggleBold(),
      "Mod-B": () => this.editor.commands.toggleBold(),
      "Mod-i": () => this.editor.commands.toggleItalic(),
      "Mod-I": () => this.editor.commands.toggleItalic(),
    };
  },
});

export function createEditorExtensions() {
  return [
    FormattingShortcuts,
    StarterKit.configure({
      link: false,
    }),
    Underline,
    Typography,
    WikiLinkExtension,
    Link.configure({
      autolink: true,
      defaultProtocol: "https",
      openOnClick: false,
      protocols: ["http", "https", "mailto"],
    }),
    WorkspaceImage.configure({
      allowBase64: true,
      inline: false,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({
      placeholder:
        "Start writing your note... Use [[double brackets]] to link to other pages.",
    }),
  ];
}

export function createStickyEditorExtensions() {
  return [
    FormattingShortcuts,
    StarterKit.configure({
      blockquote: false,
      code: false,
      codeBlock: false,
      heading: false,
      horizontalRule: false,
      link: false,
      orderedList: false,
    }),
    Link.configure({
      autolink: true,
      defaultProtocol: "https",
      openOnClick: false,
      protocols: ["http", "https", "mailto"],
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: "Quick thought, link, or task...",
    }),
  ];
}
