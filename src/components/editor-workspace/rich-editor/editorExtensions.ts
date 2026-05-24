import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
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

export function createEditorExtensions() {
  return [
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
    Image.configure({
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
        "Write, link pages with [[Page]], paste URLs, add tables, tasks, and images...",
    }),
  ];
}
