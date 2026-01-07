import { OutputBlockData } from "@editorjs/editorjs";

/**
 * Convert markdown to Editor.js blocks
 */
export function markdownToBlocks(markdown: string): OutputBlockData[] {
  if (!markdown || markdown.trim() === "") {
    return [
      {
        type: "paragraph",
        data: { text: "" },
      },
    ];
  }

  const blocks: OutputBlockData[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Empty line
    if (line === "") {
      blocks.push({
        type: "paragraph",
        data: { text: "" },
      });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      blocks.push({
        type: "header",
        data: { text: line.slice(2), level: 1 },
      });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({
        type: "header",
        data: { text: line.slice(3), level: 2 },
      });
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({
        type: "header",
        data: { text: line.slice(4), level: 3 },
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      blocks.push({
        type: "quote",
        data: { text: line.slice(2), caption: "", alignment: "left" },
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (line === "---" || line === "***" || line === "___") {
      blocks.push({
        type: "delimiter",
        data: {},
      });
      i++;
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "code",
        data: { code: codeLines.join("\n"), language: language || "plaintext" },
      });
      i++;
      continue;
    }

    // Lists
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({
        type: "list",
        data: { style: "unordered", items },
      });
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        data: { style: "ordered", items },
      });
      continue;
    }

    // Task list
    if (line.match(/^[-*]\s\[[\sxX]\]\s/)) {
      const items: Array<{ text: string; checked: boolean }> = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s\[[\sxX]\]\s/)) {
        const match = lines[i].trim().match(/^[-*]\s\[([\sxX])\]\s(.+)$/);
        if (match) {
          items.push({
            text: match[2],
            checked: match[1].toLowerCase() === "x",
          });
        }
        i++;
      }
      blocks.push({
        type: "checklist",
        data: { items },
      });
      continue;
    }

    // Regular paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().match(/^[-*]\s/) &&
      !lines[i].trim().match(/^\d+\.\s/)
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: "paragraph",
      data: { text: paragraphLines.join("\n") },
    });
  }

  return blocks.length > 0
    ? blocks
    : [{ type: "paragraph", data: { text: "" } }];
}

/**
 * Convert Editor.js blocks to markdown
 */
export function blocksToMarkdown(blocks: OutputBlockData[]): string {
  if (!blocks || blocks.length === 0) {
    return "";
  }

  const markdown: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "header":
        const level = (block.data as any).level || 1;
        const headerText = (block.data as any).text || "";
        markdown.push(`${"#".repeat(level)} ${headerText}`);
        break;

      case "paragraph":
        const text = (block.data as any).text || "";
        if (text.trim()) {
          markdown.push(text);
        } else {
          markdown.push("");
        }
        break;

      case "list":
        const listData = block.data as { style: string; items: string[] };
        if (listData.style === "ordered") {
          listData.items.forEach((item, idx) => {
            markdown.push(`${idx + 1}. ${item}`);
          });
        } else {
          listData.items.forEach((item) => {
            markdown.push(`- ${item}`);
          });
        }
        break;

      case "checklist":
        const checklistData = block.data as {
          items: Array<{ text: string; checked: boolean }>;
        };
        checklistData.items.forEach((item) => {
          markdown.push(`- [${item.checked ? "x" : " "}] ${item.text}`);
        });
        break;

      case "quote":
        const quoteText = (block.data as any).text || "";
        markdown.push(`> ${quoteText}`);
        break;

      case "code":
        const codeData = block.data as { code: string; language?: string };
        const lang = codeData.language || "";
        markdown.push(`\`\`\`${lang}`);
        markdown.push(codeData.code);
        markdown.push("```");
        break;

      case "delimiter":
        markdown.push("---");
        break;

      case "linkTool":
        const linkData = block.data as {
          link: string;
          meta?: { title?: string };
        };
        const linkTitle = linkData.meta?.title || linkData.link;
        markdown.push(`[${linkTitle}](${linkData.link})`);
        break;

      default:
        // Unknown block type, try to extract text if available
        if ((block.data as any).text) {
          markdown.push((block.data as any).text);
        }
        break;
    }
  }

  return markdown.join("\n");
}
