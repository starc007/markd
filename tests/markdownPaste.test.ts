import { describe, expect, test } from "bun:test";
import { splitFrontmatter } from "../src/lib/frontmatter";
import {
  containsMdx,
  isMarkdownPaste,
  stripMdxComponents,
} from "../src/lib/markdownPaste";

describe("isMarkdownPaste", () => {
  test("recognizes a heading followed by a list", () => {
    expect(
      isMarkdownPaste(`### 1. Backlinks and linked mentions

Show every note that links to the active note.

- Resolve links by vault-relative Markdown path.
- Keep the index local and rebuildable.`),
    ).toBe(true);
  });

  test("recognizes common block and inline Markdown", () => {
    expect(isMarkdownPaste("> A quoted paragraph")).toBe(true);
    expect(isMarkdownPaste("```ts\nconst value = true\n```")).toBe(true);
    expect(isMarkdownPaste("Read **this carefully**.")).toBe(true);
    expect(isMarkdownPaste("[Markd](https://usemarkd.app)")).toBe(true);
  });

  test("leaves ordinary prose to native paste handling", () => {
    expect(isMarkdownPaste("A normal sentence with no special formatting.")).toBe(
      false,
    );
    expect(isMarkdownPaste("First paragraph.\n\nSecond paragraph.")).toBe(false);
  });

  test("recognizes MDX components that need literal paste", () => {
    expect(
      containsMdx(`<ComponentPreview
  styleName="base-nova"
  name="accordion-demo"
/>`),
    ).toBe(true);
    expect(containsMdx('<TabsContent value="manual">')).toBe(true);
    expect(containsMdx("<p>Regular HTML</p>")).toBe(false);
  });

  test("removes MDX tags but keeps their readable content", () => {
    const source = `<TabsContent value="manual">

<Step>Install the following dependencies:</Step>

<ComponentPreview name="accordion-demo" />

## Installation

</TabsContent>`;

    const richText = stripMdxComponents(source);
    expect(richText).toContain("Install the following dependencies:");
    expect(richText).toContain("## Installation");
    expect(richText).not.toContain("TabsContent");
    expect(richText).not.toContain("ComponentPreview");
  });

  test("extracts pasted frontmatter before checking an MDX body", () => {
    const source = `---
title: Accordion
component: true
links:
  doc: https://base-ui.com/react/components/accordion
---

<ComponentPreview name="accordion-demo" />

## Installation`;
    const note = splitFrontmatter(source);

    expect(note.frontmatter).toContain("title: Accordion");
    expect(note.body).toStartWith("\n<ComponentPreview");
    expect(containsMdx(note.body)).toBe(true);
  });
});
