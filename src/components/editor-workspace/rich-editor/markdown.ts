import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService({
  blankReplacement: (_content, node) =>
    node.nodeName === "P" ? "\n\n&nbsp;\n\n" : "",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});

turndown.addRule("taskListItems", {
  filter: (node) =>
    node.nodeName === "LI" &&
    (node as HTMLElement).dataset.type === "taskItem",
  replacement: (content, node) => {
    const element = node as HTMLElement;
    const checked = element.getAttribute("data-checked") === "true";
    const body = element.querySelector(":scope > div");
    const value = body
      ? turndown.turndown(body.innerHTML).trim()
      : content.trim();

    return `- [${checked ? "x" : " "}] ${value}\n`;
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

function normalizeTaskListHtml(html: string) {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content
    .querySelectorAll<HTMLInputElement>("li > input[type='checkbox']")
    .forEach((input) => {
      const listItem = input.parentElement;
      const list = listItem?.parentElement;
      if (!listItem || list?.tagName !== "UL") return;

      list.setAttribute("data-type", "taskList");
      listItem.setAttribute("data-type", "taskItem");
      listItem.setAttribute("data-checked", String(input.checked));

      const label = document.createElement("label");
      const visual = document.createElement("span");
      input.removeAttribute("disabled");
      label.append(input, visual);

      const body = document.createElement("div");
      while (listItem.firstChild) {
        body.append(listItem.firstChild);
      }

      listItem.append(label, body);
    });

  return template.innerHTML;
}

function normalizeEmptyParagraphHtml(html: string) {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("p").forEach((paragraph) => {
    if (paragraph.innerHTML.trim() === "&nbsp;") {
      paragraph.replaceChildren();
    }
  });

  return template.innerHTML;
}

function preserveWikiLinks(markdown: string) {
  return markdown.replace(/\\\[\\\[([^\n]*?)\\\]\\\]/g, "[[$1]]");
}

export function isLikelyMarkdown(value: string) {
  const text = value.trim();
  if (!text) return false;

  return [
    /^#{1,6}\s+\S/m,
    /^>\s+\S/m,
    /^[-*+]\s+\S/m,
    /^\d+\.\s+\S/m,
    /^[-*+]\s+\[( |x|X)\]\s+\S/m,
    /^```[\s\S]*```/m,
    /^\|.+\|\n\|[-:\s|]+\|/m,
    /\[[^\]]+\]\([^)]+\)/,
    /(^|\s)(\*\*|__)[^\n]+(\*\*|__)(\s|$)/,
  ].some((pattern) => pattern.test(text));
}

export function markdownToHtml(markdown: string) {
  const html = marked(markdown, {
    async: false,
    breaks: true,
    gfm: true,
  });
  return normalizeTaskListHtml(normalizeEmptyParagraphHtml(html));
}

export function htmlToMarkdown(html: string) {
  return preserveWikiLinks(turndown.turndown(html).trimEnd());
}
