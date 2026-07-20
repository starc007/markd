import { describe, expect, test } from "bun:test";
import { hmacSha256, randomOtp, randomSlug, randomToken, sha256 } from "../src/crypto";
import { sendOtpEmail } from "../src/email";
import { normalizeEmail, OtpError } from "../src/otp";
import { presignedPutUrl } from "../src/r2-signing";
import type { Env } from "../src/types";
import {
  MAX_ACCOUNT_STORAGE_BYTES,
  publicViewInput,
  storageBytesForNewObjects,
} from "../src/usage";
import {
  beginPublishInput,
  ValidationError,
} from "../src/validation";

const ROOT_HASH = "a".repeat(64);
const ASSET_HASH = "b".repeat(64);

describe("publishing validation", () => {
  test("accepts a content-addressed release", () => {
    expect(
      beginPublishInput({
        entryId: "entry_1234567890abcdef",
        title: "  Project notes  ",
        manifest: {
          version: 1,
          rootEntryId: "entry_1234567890abcdef",
          pages: [{
            entryId: "entry_1234567890abcdef",
            path: "",
            title: "Project notes",
            objectHash: ROOT_HASH,
          }],
          objects: [{
            hash: ROOT_HASH,
            kind: "page",
            contentType: "text/markdown; charset=utf-8",
            size: 24,
          }],
        },
      }),
    ).toEqual({
      entryId: "entry_1234567890abcdef",
      title: "Project notes",
      manifest: {
        version: 1,
        rootEntryId: "entry_1234567890abcdef",
        pages: [{
          entryId: "entry_1234567890abcdef",
          path: "",
          title: "Project notes",
          objectHash: ROOT_HASH,
        }],
        objects: [{
          hash: ROOT_HASH,
          kind: "page",
          contentType: "text/markdown; charset=utf-8",
          size: 24,
        }],
      },
    });
  });

  test("accepts linked pages and hosted images", () => {
    const result = beginPublishInput({
        entryId: "entry_1234567890abcdef",
        title: "Project notes",
        manifest: {
          version: 1,
          rootEntryId: "entry_1234567890abcdef",
          pages: [{
            entryId: "entry_1234567890abcdef",
            path: "",
            title: "Project notes",
            objectHash: ROOT_HASH,
          }, {
            entryId: "entry_abcdef1234567890",
            path: "roadmap",
            title: "Roadmap",
            objectHash: ROOT_HASH,
          }],
          objects: [{
            hash: ROOT_HASH,
            kind: "page",
            contentType: "text/markdown; charset=utf-8",
            size: 24,
          }, {
            hash: ASSET_HASH,
            kind: "asset",
            contentType: "image/png",
            size: 128,
          }],
        },
    });
    expect(result.manifest.pages).toHaveLength(2);
    expect(result.manifest.objects).toHaveLength(2);
  });

  test("rejects executable image formats", () => {
    expect(() =>
      beginPublishInput({
        entryId: "entry_1234567890abcdef",
        title: "Unsafe",
        manifest: {
          version: 1,
          rootEntryId: "entry_1234567890abcdef",
          pages: [{
            entryId: "entry_1234567890abcdef",
            path: "",
            title: "Unsafe",
            objectHash: ROOT_HASH,
          }],
          objects: [{
            hash: ROOT_HASH,
            kind: "page",
            contentType: "text/markdown; charset=utf-8",
            size: 12,
          }, {
            hash: ASSET_HASH,
            kind: "asset",
            contentType: "image/svg+xml",
            size: 128,
          }],
        },
      }),
    ).toThrow(ValidationError);
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

  test("scopes direct uploads to one checksum-bound R2 object", async () => {
    const env = {
      R2_ACCOUNT_ID: "account123",
      R2_BUCKET_NAME: "published",
      R2_ACCESS_KEY_ID: "access123",
      R2_SECRET_ACCESS_KEY: "secret123",
    } as Env;
    const checksum = "YWJj";
    const signed = new URL(
      await presignedPutUrl(
        env,
        `objects/user_123/${ROOT_HASH}`,
        "image/png",
        checksum,
      ),
    );
    expect(signed.hostname).toBe("account123.r2.cloudflarestorage.com");
    expect(signed.pathname).toBe(`/published/objects/user_123/${ROOT_HASH}`);
    expect(signed.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(signed.searchParams.get("X-Amz-SignedHeaders")).toContain("x-amz-checksum-sha256");
    expect(signed.searchParams.get("X-Amz-Signature")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("publishing usage", () => {
  test("counts only content that is new to the account", () => {
    expect(
      storageBytesForNewObjects(
        [
          { hash: ROOT_HASH, kind: "page", contentType: "text/markdown; charset=utf-8", size: 24 },
          { hash: ASSET_HASH, kind: "asset", contentType: "image/png", size: 128 },
        ],
        new Set([ROOT_HASH]),
      ),
    ).toBe(128);
    expect(MAX_ACCOUNT_STORAGE_BYTES).toBe(10 * 1024 * 1024 * 1024);
  });

  test("accepts only valid public page view dimensions", () => {
    const slug = "abcdefghijklmnopqrstuv";
    expect(publicViewInput({ slug, path: "guides/getting-started" })).toEqual({
      slug,
      path: "guides/getting-started",
    });
    expect(() => publicViewInput({ slug: "bad", path: "" })).toThrow();
    expect(() => publicViewInput({ slug, path: "../private" })).toThrow();
  });
});

describe("email OTP authentication", () => {
  test("normalizes email addresses and rejects malformed input", () => {
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
    expect(() => normalizeEmail("not-an-email")).toThrow(OtpError);
  });

  test("generates six-digit codes and opaque session tokens", () => {
    expect(randomOtp()).toMatch(/^\d{6}$/);
    expect(randomToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test("uses keyed hashes for OTP challenges", async () => {
    const first = await hmacSha256("a".repeat(32), "otp_test:123456");
    const second = await hmacSha256("b".repeat(32), "otp_test:123456");
    expect(first).not.toBe(second);
    expect(first).toHaveLength(64);
  });

  test("sends login codes from the configured Markd sender", async () => {
    const messages: EmailMessageBuilder[] = [];
    const EMAIL = {
      async send(next: EmailMessageBuilder) {
        messages.push(next);
        return { messageId: "test" } as EmailSendResult;
      },
    } as SendEmail;

    await sendOtpEmail({ EMAIL }, "person@example.com", "123456");
    const message = messages[0];
    expect(message.from).toEqual({ email: "no-reply@usemarkd.app", name: "Markd" });
    expect(message.to).toBe("person@example.com");
    expect(message.subject).toBe("Your Markd sign-in code");
    expect(message.text).toContain("123456");
    expect(message.text).toContain("expires in 5 minutes");
  });
});
