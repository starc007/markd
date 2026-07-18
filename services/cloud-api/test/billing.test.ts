import { describe, expect, test } from "bun:test";
import { BillingError, checkoutInput, entitlementStatus } from "../src/billing";
import { hmacBytes } from "../src/crypto";
import { DodoWebhookError, verifyDodoWebhook } from "../src/dodo";

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

describe("Dodo webhook verification", () => {
  test("accepts a correctly signed Standard Webhooks payload", async () => {
    const rawSecret = new TextEncoder().encode("markd-webhook-test-secret");
    const secret = `whsec_${base64(rawSecret)}`;
    const id = "msg_markd_test";
    const timestamp = 1_750_000_000;
    const body = JSON.stringify({
      business_id: "bus_test",
      type: "subscription.active",
      timestamp: "2025-06-15T15:06:40.000Z",
      data: { subscription_id: "sub_test", product_id: "prod_test" },
    });
    const signature = base64(await hmacBytes(rawSecret, `${id}.${timestamp}.${body}`));
    const headers = new Headers({
      "webhook-id": id,
      "webhook-timestamp": String(timestamp),
      "webhook-signature": `v1,${signature}`,
    });

    const verified = await verifyDodoWebhook(body, headers, secret, timestamp);
    expect(verified.id).toBe(id);
    expect(verified.payload.type).toBe("subscription.active");
  });

  test("rejects payload tampering", async () => {
    const rawSecret = new TextEncoder().encode("markd-webhook-test-secret");
    const timestamp = 1_750_000_000;
    const headers = new Headers({
      "webhook-id": "msg_test",
      "webhook-timestamp": String(timestamp),
      "webhook-signature": `v1,${base64(await hmacBytes(rawSecret, "wrong"))}`,
    });
    await expect(
      verifyDodoWebhook("{}", headers, `whsec_${base64(rawSecret)}`, timestamp),
    ).rejects.toBeInstanceOf(DodoWebhookError);
  });
});

describe("Dodo entitlement mapping", () => {
  test("keeps a cancelled subscription active through its paid period", () => {
    expect(
      entitlementStatus("subscription.cancelled", "cancelled", Date.now() + 60_000),
    ).toBe("active");
  });

  test("removes access for expired and on-hold subscriptions", () => {
    expect(entitlementStatus("subscription.expired", "expired", null)).toBe("canceled");
    expect(entitlementStatus("subscription.on_hold", "on_hold", null)).toBe("past_due");
  });
});

describe("Dodo checkout input", () => {
  test("allows checkout without an app handoff", () => {
    expect(checkoutInput({ interval: "yearly" })).toEqual({ interval: "yearly" });
  });

  test("preserves a valid app handoff", () => {
    const token = "a".repeat(43);
    expect(checkoutInput({ token, interval: "monthly" })).toEqual({ token, interval: "monthly" });
  });

  test("rejects a malformed optional handoff", () => {
    expect(() => checkoutInput({ token: "bad", interval: "monthly" })).toThrow(BillingError);
  });
});
