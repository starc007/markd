import { authenticatedUser } from "./auth";
import { json, readJson } from "./http";
import type { Env, PublishObjectInput } from "./types";

export const MAX_ACCOUNT_STORAGE_BYTES = 10 * 1024 * 1024 * 1024;
const MAX_VIEW_EVENT_BYTES = 4 * 1024;
const SLUG_PATTERN = /^[a-zA-Z0-9_-]{20,24}$/;
const PAGE_PATH_PATTERN = /^(?:[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*)?$/;

interface StorageRow {
  stored_bytes: number;
  image_count: number;
}

interface CountRow {
  count: number;
}

interface PublicSiteUsageRow {
  id: string;
  user_id: string;
}

export interface AccountUsage {
  liveSites: number;
  storedBytes: number;
  imageCount: number;
  monthlyPublishes: number;
  storageLimitBytes: number;
  periodStartedAt: number;
}

export class PublishingUsageError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export async function getAccountUsage(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedUser(request, env);
  return json({ usage: await accountUsage(env, user.id) });
}

export async function accountUsage(env: Env, userId: string): Promise<AccountUsage> {
  const periodStartedAt = monthStartUtc(Date.now());
  const [sites, storage, monthly] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM sites WHERE user_id = ?")
      .bind(userId)
      .first<CountRow>(),
    storageUsage(env, userId),
    env.DB.prepare(
      `SELECT publish_count AS count FROM account_usage_monthly
       WHERE user_id = ? AND month_start = ?`,
    )
      .bind(userId, periodStartedAt)
      .first<CountRow>(),
  ]);
  return {
    liveSites: sites?.count ?? 0,
    storedBytes: storage?.stored_bytes ?? 0,
    imageCount: storage?.image_count ?? 0,
    monthlyPublishes: monthly?.count ?? 0,
    storageLimitBytes: MAX_ACCOUNT_STORAGE_BYTES,
    periodStartedAt,
  };
}

export async function assertAccountStorageLimit(
  env: Env,
  userId: string,
  objects: PublishObjectInput[],
): Promise<void> {
  const [usage, knownHashes] = await Promise.all([
    storageUsage(env, userId),
    storedObjectHashes(env, userId, objects.map((object) => object.hash)),
  ]);
  const additionalBytes = storageBytesForNewObjects(objects, knownHashes);
  const storedBytes = usage?.stored_bytes ?? 0;
  const projectedBytes = storedBytes + additionalBytes;
  if (projectedBytes <= MAX_ACCOUNT_STORAGE_BYTES) return;
  throw new PublishingUsageError(
    413,
    "publishing_storage_limit_reached",
    "This account has reached its fair-use publishing storage limit.",
    {
      storedBytes,
      additionalBytes,
      projectedBytes,
      storageLimitBytes: MAX_ACCOUNT_STORAGE_BYTES,
    },
  );
}

export async function assertPublishRateLimit(env: Env, userId: string): Promise<void> {
  const result = await env.PUBLISH_RATE_LIMITER.limit({ key: userId });
  if (result.success) return;
  throw new PublishingUsageError(
    429,
    "publishing_rate_limited",
    "Too many publishing attempts were started. Try again in a minute.",
  );
}

export function storageBytesForNewObjects(
  objects: PublishObjectInput[],
  knownHashes: ReadonlySet<string>,
): number {
  return objects.reduce(
    (total, object) => total + (knownHashes.has(object.hash) ? 0 : object.size),
    0,
  );
}

export function monthStartUtc(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function monthlyPublishStatement(env: Env, userId: string, timestamp: number) {
  return env.DB.prepare(
    `INSERT INTO account_usage_monthly (user_id, month_start, publish_count)
     VALUES (?, ?, 1)
     ON CONFLICT (user_id, month_start) DO UPDATE SET
       publish_count = publish_count + 1`,
  ).bind(userId, monthStartUtc(timestamp));
}

export function recordUsageEvent(
  env: Env,
  userId: string,
  event: string,
  siteId: string,
  resource: string,
  metrics: {
    count?: number;
    pages?: number;
    images?: number;
    bytes?: number;
    width?: number;
  } = {},
): void {
  try {
    // blobs: event, site ID, resource; doubles: count, pages, images, bytes, width.
    env.USAGE_ANALYTICS.writeDataPoint({
      blobs: [event, siteId, resource],
      doubles: [
        metrics.count ?? 1,
        metrics.pages ?? 0,
        metrics.images ?? 0,
        metrics.bytes ?? 0,
        metrics.width ?? 0,
      ],
      indexes: [userId],
    });
  } catch {
    // Usage analytics must never interrupt publishing or public page delivery.
  }
}

export async function recordPublicView(request: Request, env: Env): Promise<Response> {
  if (request.headers.get("origin") !== env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "")) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }
  const input = publicViewInput(await readJson(request, MAX_VIEW_EVENT_BYTES));
  const site = await env.DB.prepare(
    "SELECT id, user_id FROM sites WHERE slug = ? AND current_release_id IS NOT NULL",
  )
    .bind(input.slug)
    .first<PublicSiteUsageRow>();
  if (site) recordUsageEvent(env, site.user_id, "page_view", site.id, input.path);
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

export function publicViewInput(value: unknown): { slug: string; path: string } {
  if (!value || typeof value !== "object") return invalidView();
  const input = value as Record<string, unknown>;
  const slug = typeof input.slug === "string" ? input.slug : "";
  const path = typeof input.path === "string" ? input.path : "";
  if (!SLUG_PATTERN.test(slug) || !PAGE_PATH_PATTERN.test(path)) return invalidView();
  return { slug, path };
}

async function storedObjectHashes(
  env: Env,
  userId: string,
  hashes: string[],
): Promise<Set<string>> {
  const stored = new Set<string>();
  for (let index = 0; index < hashes.length; index += 80) {
    const chunk = hashes.slice(index, index + 80);
    const placeholders = chunk.map(() => "?").join(", ");
    const rows = await env.DB.prepare(
      `SELECT content_hash FROM stored_objects
       WHERE user_id = ? AND content_hash IN (${placeholders})`,
    )
      .bind(userId, ...chunk)
      .all<{ content_hash: string }>();
    for (const row of rows.results) stored.add(row.content_hash);
  }
  return stored;
}

function storageUsage(env: Env, userId: string): Promise<StorageRow | null> {
  return env.DB.prepare(
    `SELECT
       COALESCE(SUM(byte_size), 0) AS stored_bytes,
       COALESCE(SUM(CASE WHEN kind = 'asset' THEN 1 ELSE 0 END), 0) AS image_count
     FROM stored_objects WHERE user_id = ?`,
  )
    .bind(userId)
    .first<StorageRow>();
}

function invalidView(): never {
  throw new PublishingUsageError(400, "invalid_view_event", "The page view event is invalid.");
}
