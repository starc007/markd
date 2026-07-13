import { describe, expect, test } from "bun:test";
import {
  expandDefaultLinkLabels,
  relToLabel,
  resolveWiki,
  wikiToMarkdown,
} from "../src/lib/noteLinks";

const notes = [
  { rel: "Root.md" },
  { rel: "projects/Roadmap.md" },
];

describe("note link labels", () => {
  test("keeps folder context in default labels", () => {
    expect(relToLabel("projects/Roadmap.md")).toBe("projects/Roadmap");
    expect(resolveWiki("Roadmap", notes)).toEqual({
      rel: "projects/Roadmap.md",
      title: "projects/Roadmap",
    });
  });

  test("makes labels relative to the current note folder", () => {
    expect(
      relToLabel(
        "user-knowledgebase/projects/Roadmap.md",
        "user-knowledgebase/INDEX.md",
      ),
    ).toBe("projects/Roadmap");
    expect(
      relToLabel(
        "user-knowledgebase/About.md",
        "user-knowledgebase/INDEX.md",
      ),
    ).toBe("About");
  });

  test("keeps explicit wiki aliases", () => {
    expect(wikiToMarkdown("[[Roadmap|plan]]", notes)).toBe(
      "[plan](projects/Roadmap.md)",
    );
  });

  test("expands existing nested note labels in the editor", () => {
    expect(
      expandDefaultLinkLabels("[Roadmap](projects/Roadmap.md)", notes),
    ).toBe("[projects/Roadmap](projects/Roadmap.md)");
  });

  test("removes the containing note folder from existing labels", () => {
    const nestedNotes = [
      { rel: "user-knowledgebase/INDEX.md" },
      { rel: "user-knowledgebase/projects/Roadmap.md" },
    ];
    expect(
      expandDefaultLinkLabels(
        "[user-knowledgebase/projects/Roadmap](user-knowledgebase/projects/Roadmap.md)",
        nestedNotes,
        "user-knowledgebase/INDEX.md",
      ),
    ).toBe("[projects/Roadmap](user-knowledgebase/projects/Roadmap.md)");
  });

  test("preserves aliases, external links, images, and root note labels", () => {
    const markdown = [
      "[plan](projects/Roadmap.md)",
      "[site](https://example.com)",
      "![Roadmap](projects/Roadmap.md)",
      "[Root](Root.md)",
    ].join("\n");

    expect(expandDefaultLinkLabels(markdown, notes)).toBe(markdown);
  });
});
