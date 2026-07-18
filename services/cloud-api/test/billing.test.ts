import { describe, expect, test } from "bun:test";
import { BillingError, checkoutInput, entitlementStatus } from "../src/billing";
import { hmacBytes } from "../src/crypto";
import { createCheckoutSession, DodoWebhookError, verifyDodoWebhook } from "../src/dodo";
import type { Env } from "../src/types";

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

describe("Dodo checkout session", () => {
  test("uses minimal address collection and the Markd success page", async () => {
    const originalFetch = globalThis.fetch;
    let requestBody: Record<string, unknown> | undefined;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json({ checkout_url: "https://checkout.dodopayments.com/test" });
    }) as typeof fetch;

    try {
      const env = {
        DODO_PAYMENTS_API_KEY: "test_key",
        DODO_PAYMENTS_ENVIRONMENT: "test_mode",
        DODO_MONTHLY_PRODUCT_ID: "monthly_product",
        DODO_YEARLY_PRODUCT_ID: "yearly_product",
        PUBLIC_SITE_ORIGIN: "https://usemarkd.app/",
      } as Env;
      await createCheckoutSession(env, null, "yearly");

      expect(requestBody?.minimal_address).toBe(true);
      expect(requestBody?.customer).toBeUndefined();
      expect(requestBody?.return_url).toBe("https://usemarkd.app/checkout/success");
      expect(requestBody?.customization).toEqual({ redirect_immediately: true, theme: "light" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
