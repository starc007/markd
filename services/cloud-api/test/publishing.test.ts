import { describe, expect, test } from "bun:test";
import { randomSlug, sha256 } from "../src/crypto";
import {
  idempotencyKey,
  publishInput,
  ValidationError,
} from "../src/validation";

describe("publishing validation", () => {
  test("accepts a valid publish snapshot", () => {
    expect(
      publishInput({
        entryId: "entry_1234567890abcdef",
        title: "  Project notes  ",
        markdown: "# Project\n\nHello.",
      }),
    ).toEqual({
      entryId: "entry_1234567890abcdef",
      title: "Project notes",
      markdown: "# Project\n\nHello.",
    });
  });

  test("rejects empty notes", () => {
    expect(() =>
      publishInput({
        entryId: "entry_1234567890abcdef",
        title: "Empty",
        markdown: "  ",
      }),
    ).toThrow(ValidationError);
  });

  test("requires an idempotency credential", () => {
    const request = new Request("https://api.example.test/v1/shares", {
      headers: {
        "idempotency-key": "publish_1234567890abcdef",
      },
    });
    expect(idempotencyKey(request)).toBe("publish_1234567890abcdef");
  });
});

describe("publishing identifiers", () => {
  test("generates an unguessable URL-safe slug", () => {
    const slug = randomSlug();
    expect(slug).toMatch(/^[a-zA-Z0-9_-]{22}$/);
  });

  test("hashes content deterministically", async () => {
    expect(await sha256("Markd")).toBe(
      "5f760a58961babe4c488f61b3457e73fc9d9b78f5727b04ae80a8e470580eb6f",
    );
  });
});
