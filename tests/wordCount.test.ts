import { describe, expect, test } from "bun:test";
import {
  countMarkdownWords,
  countWords,
  extractBodySelection,
  stripMarkdownSyntax,
} from "../src/lib/wordCount";

describe("word counting", () => {
  test("counts simple prose words", () => {
    expect(countWords("Hello world")).toBe(2);
    expect(countWords("One two three four five")).toBe(5);
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t  ")).toBe(0);
  });

  test("counts rendered prose words preserving literal symbols", () => {
    // In rich-text mode, `# hello` from inline code is rendered text
    expect(countWords("# hello")).toBe(2);
    expect(countWords("> quote")).toBe(2);
  });

  test("excludes markdown headings from raw markdown word count", () => {
    expect(countMarkdownWords("# Hello world")).toBe(2);
    expect(countMarkdownWords("## Subtitle")).toBe(1);
    expect(countMarkdownWords("###### Deep heading with multiple words")).toBe(5);
    expect(countMarkdownWords("> # Hello world")).toBe(2);
    expect(countMarkdownWords(">> # Hello world")).toBe(2);
  });

  test("excludes list markers and blockquotes in raw markdown", () => {
    expect(countMarkdownWords("- Item one\n- Item two")).toBe(4);
    expect(countMarkdownWords("* Star item")).toBe(2);
    expect(countMarkdownWords("- [ ] Unchecked todo\n- [x] Done todo")).toBe(4);
    expect(countMarkdownWords("1. First item\n2. Second item")).toBe(4);
    expect(countMarkdownWords("> Blockquote line")).toBe(2);
    expect(countMarkdownWords(">> Nested blockquote")).toBe(2);
    expect(countMarkdownWords("> > Nested blockquote with spaces")).toBe(4);
    expect(countMarkdownWords(">>> Triple nested blockquote")).toBe(3);
  });

  test("excludes table syntax and delimiter rows from raw markdown word count", () => {
    const tableWithBorders = [
      "| Name | Value |",
      "| --- | --- |",
      "| Alice | Ready |",
    ].join("\n");
    expect(countMarkdownWords(tableWithBorders)).toBe(4);

    const tableWithoutBorders = [
      "Name | Value",
      "--- | ---",
      "Alice | Ready",
    ].join("\n");
    expect(countMarkdownWords(tableWithoutBorders)).toBe(4);
  });

  test("handles links, inline code, and formatting markers in raw markdown", () => {
    expect(countMarkdownWords("[Markd app](https://markd.app)")).toBe(2);
    expect(countMarkdownWords("![alt text](https://example.com/image.png)")).toBe(2);
    expect(countMarkdownWords("[[Daily Note|Today's Note]]")).toBe(2);
    expect(countMarkdownWords("[[SimpleNote]]")).toBe(1);
    expect(countMarkdownWords("**bold** *italic* ~~strike~~ `code`")).toBe(4);
    expect(countMarkdownWords("`# hello`")).toBe(2);
  });
});

describe("extractBodySelection", () => {
  const doc = [
    "---",
    'title: "Example"',
    "status: done",
    "---",
    "",
    "Hello world",
    "Second line",
  ].join("\n");

  test("returns empty string when selection is entirely within frontmatter", () => {
    // Select "title: "Example""
    const from = doc.indexOf("title");
    const to = from + 16;
    expect(extractBodySelection(doc, from, to)).toBe("");
    expect(countWords(extractBodySelection(doc, from, to))).toBe(0);
  });

  test("returns only body portion when selection spans across frontmatter and body", () => {
    // Select from status to "Hello"
    const from = doc.indexOf("status");
    const to = doc.indexOf("Hello") + 5;
    const extracted = extractBodySelection(doc, from, to);
    expect(extracted).toBe("\nHello");
    expect(countWords(extracted)).toBe(1);
  });

  test("returns selected body text when selection is entirely in body", () => {
    const from = doc.indexOf("Hello world");
    const to = from + "Hello world".length;
    const extracted = extractBodySelection(doc, from, to);
    expect(extracted).toBe("Hello world");
    expect(countWords(extracted)).toBe(2);
  });

  test("handles document without frontmatter", () => {
    const noFm = "Simple body text without frontmatter";
    const from = noFm.indexOf("body");
    const to = from + 4;
    expect(extractBodySelection(noFm, from, to)).toBe("body");
    expect(countWords(extractBodySelection(noFm, from, to))).toBe(1);
  });

  test("correctly extracts selection after document indentation (e.g. Tab in source mode)", () => {
    // Initial document before indentation: "a b"
    // After indenting with 2 spaces: "  a b"
    // Range [2, 5] in the indented document corresponds to "a b"
    const indentedDoc = "  a b";
    const from = 2;
    const to = 5;
    const extracted = extractBodySelection(indentedDoc, from, to);
    expect(extracted).toBe("a b");
    expect(countWords(extracted)).toBe(2);
  });
});

describe("mode-dependent note loading and reloading", () => {
  // A note containing an image: in rich-text mode the rendered image produces no prose words,
  // whereas in source mode the markdown tokens (![alt text](url)) contribute the alt text words.
  const noteBody = "Hello ![alt text](https://example.com/image.png)";
  const renderedProseText = "Hello";

  test("calculates total words according to active editor mode on initial load", () => {
    // When opened directly in source mode
    const sourceTotal = countMarkdownWords(noteBody);
    expect(sourceTotal).toBe(3); // "Hello", "alt", "text"

    // When opened in rich-text mode
    const richTotal = countWords(renderedProseText);
    expect(richTotal).toBe(1); // "Hello"

    // Verify source mode selection matches source total when selecting all
    const allSelectedSource = extractBodySelection(noteBody, 0, noteBody.length);
    expect(countMarkdownWords(allSelectedSource)).toBe(sourceTotal);
  });

  test("reloads external edits using the active mode rules after mode switch", () => {
    // Simulate reloading an external edit after toggling between modes:
    const reloadedBody = "Updated note with ![photo label](https://example.com/pic.png)";
    const reloadedRenderedText = "Updated note with";

    // If active mode is source mode:
    const sourceReloadWords = countMarkdownWords(reloadedBody);
    expect(sourceReloadWords).toBe(5); // "Updated", "note", "with", "photo", "label"

    // If active mode is rich-text mode:
    const richReloadWords = countWords(reloadedRenderedText);
    expect(richReloadWords).toBe(3); // "Updated", "note", "with"
  });
});


