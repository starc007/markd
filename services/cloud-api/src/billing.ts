import { authenticatedUser } from "./auth";
import { randomToken, sha256 } from "./crypto";
import {
  createCheckoutSession,
  createPortalSession,
  DodoApiError,
  DodoWebhookError,
  type DodoSubscription,
  verifyDodoWebhook,
} from "./dodo";
import { json, readJson } from "./http";
import type { AuthenticatedUser, BillingInterval, Env } from "./types";

const HANDOFF_TTL_MS = 15 * 60 * 1000;
const SUBSCRIPTION_EVENTS = new Set([
  "subscription.active",
  "subscription.updated",
  "subscription.on_hold",
  "subscription.renewed",
  "subscription.plan_changed",
  "subscription.cancelled",
  "subscription.failed",
  "subscription.expired",
]);

interface HandoffRow {
  user_id: string;
  email: string;
}

interface EntitlementLookup {
  user_id: string;
}

export class BillingError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function createBillingHandoff(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedUser(request, env);
  const token = randomToken();
  const now = Date.now();
  const expiresAt = now + HANDOFF_TTL_MS;
  await env.DB.prepare(
    `INSERT INTO billing_handoffs (token_hash, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(await sha256(token), user.id, expiresAt, now).run();
  const pricingUrl = new URL("/pricing", env.PUBLIC_SITE_ORIGIN);
  pricingUrl.searchParams.set("billing_token", token);
  return json({ url: pricingUrl.toString(), expiresAt });
}

export async function beginCheckout(request: Request, env: Env): Promise<Response> {
  const input = checkoutInput(await readJson(request, 4_096));
  const tokenHash = await sha256(input.token);
  const usedAt = Date.now();
  const handoff = await env.DB.prepare(
    `UPDATE billing_handoffs SET used_at = ?
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
     RETURNING user_id, (SELECT email FROM users WHERE id = user_id) AS email`,
  ).bind(usedAt, tokenHash, usedAt).first<HandoffRow>();
  if (!handoff) {
    throw new BillingError(401, "billing_link_expired", "Open pricing from Markd again to continue.");
  }

  const user: AuthenticatedUser = { id: handoff.user_id, email: handoff.email, plan: "free" };
  try {
    return json({ checkoutUrl: await createCheckoutSession(env, user, input.interval) });
  } catch (cause) {
    await env.DB.prepare(
      "UPDATE billing_handoffs SET used_at = NULL WHERE token_hash = ? AND used_at = ?",
    ).bind(tokenHash, usedAt).run();
    if (cause instanceof DodoApiError) throw new BillingError(502, "checkout_unavailable", cause.message);
    throw cause;
  }
}

export async function billingPortal(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedUser(request, env);
  const row = await env.DB.prepare(
    "SELECT provider_customer_id FROM entitlements WHERE user_id = ? AND provider = 'dodo'",
  ).bind(user.id).first<{ provider_customer_id: string | null }>();
  if (!row?.provider_customer_id) {
    throw new BillingError(404, "billing_customer_missing", "No billing account exists for this user.");
  }
  try {
    return json({ url: await createPortalSession(env, row.provider_customer_id) });
  } catch (cause) {
    if (cause instanceof DodoApiError) throw new BillingError(502, "portal_unavailable", cause.message);
    throw cause;
  }
}

export async function dodoWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  let verified;
  try {
    verified = await verifyDodoWebhook(rawBody, request.headers, env.DODO_PAYMENTS_WEBHOOK_KEY);
  } catch (cause) {
    if (cause instanceof DodoWebhookError) throw new BillingError(400, "invalid_webhook", cause.message);
    throw cause;
  }
  if (verified.payload.business_id !== env.DODO_BUSINESS_ID) {
    throw new BillingError(400, "invalid_webhook", "The webhook business does not match Markd.");
  }

  const duplicate = await env.DB.prepare("SELECT 1 FROM billing_webhooks WHERE id = ?")
    .bind(verified.id).first();
  if (duplicate) return json({ received: true, duplicate: true });

  if (SUBSCRIPTION_EVENTS.has(verified.payload.type)) {
    await syncSubscription(env, verified.payload.type, verified.payload.timestamp, verified.payload.data);
  }
  await env.DB.prepare(
    "INSERT OR IGNORE INTO billing_webhooks (id, event_type, processed_at) VALUES (?, ?, ?)",
  ).bind(verified.id, verified.payload.type, Date.now()).run();
  return json({ received: true });
}

export async function cleanupBillingRecords(env: Env): Promise<void> {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM billing_handoffs WHERE expires_at <= ?").bind(now),
    env.DB.prepare("DELETE FROM billing_webhooks WHERE processed_at <= ?")
      .bind(now - 90 * 24 * 60 * 60 * 1000),
  ]);
}

async function syncSubscription(
  env: Env,
  eventType: string,
  eventTimestamp: string,
  subscription: DodoSubscription,
): Promise<void> {
  if (!subscription.subscription_id || !subscription.product_id) return;
  const interval = productInterval(env, subscription.product_id);
  if (!interval) return;
  const userId = await subscriptionUserId(env, subscription);
  if (!userId) throw new BillingError(409, "billing_user_missing", "The subscription has no Markd user.");

  const providerUpdatedAt = Date.parse(eventTimestamp);
  const periodEnd = subscription.next_billing_date
    ? Date.parse(subscription.next_billing_date)
    : null;
  const status = entitlementStatus(eventType, subscription.status, periodEnd);
  await env.DB.prepare(
    `INSERT INTO entitlements (
       user_id, plan, status, current_period_end, provider, provider_customer_id,
       provider_subscription_id, billing_interval, provider_status, provider_updated_at
     ) VALUES (?, 'cloud', ?, ?, 'dodo', ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       plan = 'cloud', status = excluded.status,
       current_period_end = excluded.current_period_end, provider = 'dodo',
       provider_customer_id = excluded.provider_customer_id,
       provider_subscription_id = excluded.provider_subscription_id,
       billing_interval = excluded.billing_interval,
       provider_status = excluded.provider_status,
       provider_updated_at = excluded.provider_updated_at
     WHERE excluded.provider_updated_at >= entitlements.provider_updated_at`,
  ).bind(
    userId,
    status,
    Number.isFinite(periodEnd) ? periodEnd : null,
    subscription.customer?.customer_id ?? null,
    subscription.subscription_id,
    interval,
    subscription.status ?? eventType.replace("subscription.", ""),
    Number.isFinite(providerUpdatedAt) ? providerUpdatedAt : Date.now(),
  ).run();
}

async function subscriptionUserId(env: Env, subscription: DodoSubscription): Promise<string | null> {
  const metadataUser = subscription.metadata?.markd_user_id;
  if (metadataUser) {
    const user = await env.DB.prepare("SELECT id FROM users WHERE id = ?")
      .bind(metadataUser).first<{ id: string }>();
    if (user) return user.id;
  }
  const customerId = subscription.customer?.customer_id;
  if (customerId) {
    const entitlement = await env.DB.prepare(
      "SELECT user_id FROM entitlements WHERE provider = 'dodo' AND provider_customer_id = ?",
    ).bind(customerId).first<EntitlementLookup>();
    if (entitlement) return entitlement.user_id;
  }
  const email = subscription.customer?.email?.trim().toLowerCase();
  if (!email) return null;
  const user = await env.DB.prepare("SELECT id AS user_id FROM users WHERE email = ?")
    .bind(email).first<EntitlementLookup>();
  return user?.user_id ?? null;
}

function checkoutInput(value: unknown): { token: string; interval: BillingInterval } {
  if (!value || typeof value !== "object") throw new BillingError(400, "invalid_checkout", "Checkout details are required.");
  const input = value as Record<string, unknown>;
  if (typeof input.token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.token)) {
    throw new BillingError(400, "invalid_checkout", "The billing link is invalid.");
  }
  if (input.interval !== "monthly" && input.interval !== "yearly") {
    throw new BillingError(400, "invalid_checkout", "Choose monthly or yearly billing.");
  }
  return { token: input.token, interval: input.interval };
}

function productInterval(env: Env, productId: string): BillingInterval | null {
  if (productId === env.DODO_MONTHLY_PRODUCT_ID) return "monthly";
  if (productId === env.DODO_YEARLY_PRODUCT_ID) return "yearly";
  return null;
}

export function entitlementStatus(
  eventType: string,
  providerStatus: string | undefined,
  periodEnd: number | null,
): "active" | "past_due" | "canceled" {
  if (providerStatus === "active" || eventType === "subscription.active" || eventType === "subscription.renewed") return "active";
  if (providerStatus === "on_hold" || eventType === "subscription.on_hold") return "past_due";
  if (providerStatus === "cancelled" && periodEnd && periodEnd > Date.now()) return "active";
  return "canceled";
}
