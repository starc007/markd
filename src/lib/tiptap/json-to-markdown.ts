import type { JSONContent } from "@tiptap/core";

/**
 * Convert Tiptap JSON to markdown
 * This is a simple converter for export functionality
 */
export function jsonToMarkdown(json: JSONContent): string {
  if (!json || !json.content || json.content.length === 0) {
    return "";
  }

  const lines: string[] = [];

  for (const node of json.content) {
    convertNode(node, lines);
  }

  return lines.join("\n");
}

function convertNode(node: JSONContent, lines: string[]): void {
  switch (node.type) {
    case "heading":
      const level = node.attrs?.level || 1;
      const headingText = extractText(node);
      lines.push(`${"#".repeat(level)} ${headingText}`);
      break;

    case "paragraph":
      const text = extractText(node);
      lines.push(text || "");
      break;

    case "bulletList":
      if (node.content) {
        for (const item of node.content) {
          const itemText = extractText(item);
          lines.push(`- ${itemText}`);
        }
      }
      break;

    case "orderedList":
      if (node.content) {
        node.content.forEach((item, idx) => {
          const itemText = extractText(item);
          lines.push(`${idx + 1}. ${itemText}`);
        });
      }
      break;

    case "taskList":
      if (node.content) {
        for (const item of node.content) {
          const checked = item.attrs?.checked || false;
          const itemText = extractText(item);
          lines.push(`- [${checked ? "x" : " "}] ${itemText}`);
        }
      }
      break;

    case "codeBlock":
      const codeText = extractText(node);
      const language = node.attrs?.language || "";
      lines.push(`\`\`\`${language}`);
      lines.push(codeText);
      lines.push("```");
      break;

    case "blockquote":
      if (node.content) {
        for (const child of node.content) {
          const quoteText = extractText(child);
          lines.push(`> ${quoteText}`);
        }
      }
      break;

    case "horizontalRule":
      lines.push("---");
      break;

    default:
      // Try to extract text from unknown nodes
      const fallbackText = extractText(node);
      if (fallbackText) {
        lines.push(fallbackText);
      }
      break;
  }
}

function extractText(node: JSONContent): string {
  if (!node) return "";

  if (node.type === "text") {
    let text = node.text || "";

    // Apply marks (bold, italic, etc.)
    if (node.marks && Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold":
            text = `**${text}**`;
            break;
          case "italic":
            text = `*${text}*`;
            break;
          case "code":
            text = `\`${text}\``;
            break;
          case "strike":
            text = `~~${text}~~`;
            break;
          case "link":
            const href = mark.attrs?.href || "";
            text = `[${text}](${href})`;
            break;
          // Ignore marks that don't have markdown equivalents
          case "underline":
          case "highlight":
            // Keep text as-is
            break;
        }
      }
    }

    return text;
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractText).join("");
  }

  return "";
}
