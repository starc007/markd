import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});

turndown.addRule("taskListItems", {
  filter: (node) =>
    node.nodeName === "LI" &&
    (node as HTMLElement).dataset.type === "taskItem",
  replacement: (content, node) => {
    const checked =
      (node as HTMLElement).getAttribute("data-checked") === "true";
    return `- [${checked ? "x" : " "}] ${content.trim()}\n`;
  },
});

turndown.addRule("tables", {
  filter: "table",
  replacement: (_content, node) => {
    const rows = Array.from((node as HTMLTableElement).querySelectorAll("tr"));
    const markdownRows = rows.map((row) =>
      Array.from(row.querySelectorAll("th,td"))
        .map((cell) => turndown.turndown(cell.innerHTML).replace(/\n/g, " "))
        .map((cell) => cell.trim() || " ")
        .join(" | "),
    );

    if (markdownRows.length === 0) return "";

    const columns = markdownRows[0].split(" | ").length;
    const divider = Array.from({ length: columns })
      .map(() => "---")
      .join(" | ");

    return `\n\n${markdownRows[0]}\n${divider}\n${markdownRows.slice(1).join("\n")}\n\n`;
  },
});

export function markdownToHtml(markdown: string) {
  return marked(markdown, {
    async: false,
    breaks: true,
    gfm: true,
  });
}

export function htmlToMarkdown(html: string) {
  return turndown.turndown(html).trimEnd();
}

