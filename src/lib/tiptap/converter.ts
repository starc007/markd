import type { JSONContent } from "@tiptap/core";

/**
 * Convert markdown to Tiptap/ProseMirror JSON
 */
export function markdownToJSON(markdown: string): JSONContent {
  if (!markdown || markdown.trim() === "") {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    };
  }

  const content: JSONContent[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Empty line
    if (line === "") {
      content.push({
        type: "paragraph",
      });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: line.slice(2) }],
      });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: line.slice(3) }],
      });
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: line.slice(4) }],
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      content.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: line.slice(2) }],
          },
        ],
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (line === "---" || line === "***" || line === "___") {
      content.push({
        type: "horizontalRule",
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
      content.push({
        type: "codeBlock",
        attrs: { language: language || "plaintext" },
        content: [{ type: "text", text: codeLines.join("\n") }],
      });
      i++;
      continue;
    }

    // Task list (checklist)
    if (line.match(/^[-*]\s\[[\sxX]\]\s/)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s\[[\sxX]\]\s/)) {
        const match = lines[i].trim().match(/^[-*]\s\[([\sxX])\]\s(.+)$/);
        if (match) {
          items.push({
            type: "taskItem",
            attrs: { checked: match[1].toLowerCase() === "x" },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: match[2] }],
              },
            ],
          });
        }
        i++;
      }
      content.push({
        type: "taskList",
        content: items,
      });
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: lines[i].trim().slice(2) }],
            },
          ],
        });
        i++;
      }
      content.push({
        type: "bulletList",
        content: items,
      });
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: lines[i].trim().replace(/^\d+\.\s/, "") },
              ],
            },
          ],
        });
        i++;
      }
      content.push({
        type: "orderedList",
        content: items,
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
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: paragraphLines.join("\n") }],
    });
  }

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

/**
 * Convert Tiptap/ProseMirror JSON to markdown
 */
export function jsonToMarkdown(doc: JSONContent): string {
  if (!doc || !doc.content || doc.content.length === 0) {
    return "";
  }

  const markdown: string[] = [];

  for (const node of doc.content) {
    switch (node.type) {
      case "heading":
        const level = node.attrs?.level || 1;
        const headingText = extractText(node);
        markdown.push(`${"#".repeat(level)} ${headingText}`);
        break;

      case "paragraph":
        const text = extractText(node);
        if (text.trim()) {
          markdown.push(text);
        } else {
          markdown.push("");
        }
        break;

      case "bulletList":
        if (node.content) {
          for (const item of node.content) {
            const itemText = extractText(item);
            markdown.push(`- ${itemText}`);
          }
        }
        break;

      case "orderedList":
        if (node.content) {
          node.content.forEach((item, idx) => {
            const itemText = extractText(item);
            markdown.push(`${idx + 1}. ${itemText}`);
          });
        }
        break;

      case "taskList":
        if (node.content) {
          for (const item of node.content) {
            const checked = item.attrs?.checked || false;
            const itemText = extractText(item);
            markdown.push(`- [${checked ? "x" : " "}] ${itemText}`);
          }
        }
        break;

      case "blockquote":
        if (node.content) {
          const quoteText = extractText(node);
          quoteText.split("\n").forEach((line) => {
            markdown.push(`> ${line}`);
          });
        }
        break;

      case "codeBlock":
        const codeText = extractText(node);
        const language = node.attrs?.language || "";
        markdown.push(`\`\`\`${language}`);
        markdown.push(codeText);
        markdown.push("```");
        break;

      case "horizontalRule":
        markdown.push("---");
        break;

      default:
        // Unknown node type, try to extract text
        const fallbackText = extractText(node);
        if (fallbackText) {
          markdown.push(fallbackText);
        }
        break;
    }
  }

  return markdown.join("\n");
}

/**
 * Extract plain text from a ProseMirror node
 */
function extractText(node: JSONContent): string {
  if (!node) return "";

  if (node.type === "text") {
    return node.text || "";
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractText).join("");
  }

  return "";
}
