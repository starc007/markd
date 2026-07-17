import { describe, expect, test } from "bun:test";
import {
  findPlainTextMatches,
  replaceMatches,
  replaceTextRange,
  wrapIndex,
} from "../src/components/editor/noteFind";

describe("note find helpers", () => {
  test("finds every case-insensitive match", () => {
    expect(findPlainTextMatches("Token token TOKEN", "token")).toEqual([
      { from: 0, to: 5 },
      { from: 6, to: 11 },
      { from: 12, to: 17 },
    ]);
  });

  test("replaces one match without changing surrounding text", () => {
    expect(
      replaceTextRange("one two three", { from: 4, to: 7 }, "four"),
    ).toBe("one four three");
  });

  test("replaces all matches from the end to preserve ranges", () => {
    const text = "a cat and a cat";
    const matches = findPlainTextMatches(text, "cat");
    expect(replaceMatches(text, matches, "doggo")).toBe("a doggo and a doggo");
  });

  test("wraps match navigation in both directions", () => {
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(0, 0)).toBe(0);
  });
});
