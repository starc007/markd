import { describe, expect, test } from "bun:test";
import {
  noteDescription,
  publishedProperties,
  stripPublishedFrontmatter,
} from "../site/lib/published-note";

describe("published notes", () => {
  test("splits YAML frontmatter from rendered body", () => {
    const markdown = [
      "---",
      'status: "done"',
      "Tagged:",
      '  - "hello"',
      '  - "hi"',
      "---",
      "",
      "# Visible note",
      "",
      "Body text.",
    ].join("\n");

    expect(stripPublishedFrontmatter(markdown)).toBe(
      "# Visible note\n\nBody text.",
    );
  });

  test("parses YAML frontmatter properties for display", () => {
    const markdown = [
      "---",
      'status: "done"',
      "Tagged:",
      '  - "hello"',
      '  - "hi"',
      '  - "hey"',
      "---",
      "Body text.",
    ].join("\n");

    expect(publishedProperties(markdown)).toEqual([
      { key: "status", value: "done" },
      { key: "Tagged", value: ["hello", "hi", "hey"] },
    ]);
  });

  test("omits frontmatter from descriptions", () => {
    expect(noteDescription('---\nstatus: "done"\n---\nReal summary.')).toBe(
      "Real summary.",
    );
  });
});
