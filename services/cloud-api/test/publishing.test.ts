import { describe, expect, test } from "bun:test";
import { hmacSha256, randomOtp, randomSlug, randomToken, sha256 } from "../src/crypto";
import { sendOtpEmail } from "../src/email";
import { normalizeEmail, OtpError } from "../src/otp";
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
