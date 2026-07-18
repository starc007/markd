import { hmacBytes } from "./crypto";
import type { AuthenticatedUser, BillingInterval, Env } from "./types";

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export class DodoApiError extends Error {}
export class DodoWebhookError extends Error {}

export interface DodoWebhookPayload {
  business_id: string;
  type: string;
  timestamp: string;
  data: DodoSubscription;
}

export interface DodoSubscription {
  payload_type?: string;
  subscription_id?: string;
  product_id?: string;
  status?: string;
  next_billing_date?: string | null;
  cancel_at_next_billing_date?: boolean;
  metadata?: Record<string, string>;
  customer?: {
    customer_id?: string;
    email?: string;
  };
}

function apiBase(env: Env): string {
  return env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com";
}

async function dodoRequest<T>(
  env: Env,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBase(env)}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    console.error("Dodo API request failed", response.status);
    throw new DodoApiError("The billing provider could not complete the request.");
  }
  return response.json<T>();
}

export async function createCheckoutSession(
  env: Env,
  user: AuthenticatedUser | null,
  interval: BillingInterval,
): Promise<string> {
  const productId = interval === "yearly"
    ? env.DODO_YEARLY_PRODUCT_ID
    : env.DODO_MONTHLY_PRODUCT_ID;
  if (!productId) throw new DodoApiError("The selected billing plan is not configured.");

  const origin = env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "");
  const checkout = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    metadata: {
      ...(user ? { markd_user_id: user.id } : {}),
      markd_billing_interval: interval,
    },
    return_url: `${origin}/pricing?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    ...(user ? { customer: { email: user.email, name: user.email.split("@")[0] } } : {}),
  };
  const result = await dodoRequest<{ checkout_url: string | null }>(env, "/checkouts", {
    method: "POST",
    body: JSON.stringify(checkout),
  });
  if (!result.checkout_url) throw new DodoApiError("Dodo did not return a checkout URL.");
  return result.checkout_url;
}

export async function createPortalSession(
  env: Env,
  customerId: string,
): Promise<string> {
  const path = `/customers/${encodeURIComponent(customerId)}/customer-portal/session`;
  const query = new URLSearchParams({
    return_url: `${env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "")}/pricing`,
  });
  const result = await dodoRequest<{ link: string }>(env, `${path}?${query}`, {
    method: "POST",
  });
  return result.link;
}

export async function verifyDodoWebhook(
  rawBody: string,
  headers: Headers,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<{ id: string; payload: DodoWebhookPayload }> {
  const id = headers.get("webhook-id") ?? "";
  const timestamp = headers.get("webhook-timestamp") ?? "";
  const signatures = headers.get("webhook-signature") ?? "";
  const timestampNumber = Number(timestamp);
  if (!id || !Number.isInteger(timestampNumber)) throw new DodoWebhookError("Missing webhook headers.");
  if (Math.abs(nowSeconds - timestampNumber) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new DodoWebhookError("Webhook timestamp is outside the accepted window.");
  }

  const secretBytes = decodeWebhookSecret(secret);
  const expected = await hmacBytes(secretBytes, `${id}.${timestamp}.${rawBody}`);
  const valid = signatures
    .split(" ")
    .map((signature) => signature.split(",", 2))
    .some(([version, encoded]) => version === "v1" && matchesBase64(expected, encoded));
  if (!valid) throw new DodoWebhookError("Webhook signature is invalid.");

  let payload: DodoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DodoWebhookPayload;
  } catch {
    throw new DodoWebhookError("Webhook payload is not valid JSON.");
  }
  if (!payload.type || !payload.data) throw new DodoWebhookError("Webhook payload is incomplete.");
  return { id, payload };
}

function decodeWebhookSecret(secret: string): Uint8Array {
  const encoded = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  } catch {
    throw new DodoWebhookError("Webhook secret is malformed.");
  }
}

function matchesBase64(expected: Uint8Array, encoded: string | undefined): boolean {
  if (!encoded) return false;
  let actual: Uint8Array;
  try {
    actual = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}
