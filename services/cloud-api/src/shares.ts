import { newId, randomSlug, sha256 } from "./crypto";
import { authenticatedUser } from "./auth";
import { error, json, notFound, readJson } from "./http";
import type { Env, ShareResponse, ShareRow } from "./types";
import { idempotencyKey, MAX_REQUEST_BYTES, publishInput } from "./validation";

const SHARE_COLUMNS = `
  id, entry_id, user_id, slug, title, object_key,
  content_hash, status, idempotency_key, published_at, updated_at, revoked_at
`;

function response(row: ShareRow, siteOrigin: string): ShareResponse {
  return {
    id: row.id,
    entryId: row.entry_id,
    slug: row.slug,
    url: `${siteOrigin.replace(/\/$/, "")}/s/${row.slug}`,
    title: row.title,
    contentHash: row.content_hash,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

async function findOwnedShare(
  env: Env,
  shareId: string,
  userId: string,
): Promise<ShareRow | null> {
  return env.DB.prepare(
    `SELECT ${SHARE_COLUMNS} FROM shares
     WHERE id = ? AND user_id = ? AND status = 'active'`,
  )
    .bind(shareId, userId)
    .first<ShareRow>();
}

export async function createShare(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedUser(request, env);
  const requestKey = idempotencyKey(request);
  const input = publishInput(await readJson(request, MAX_REQUEST_BYTES));

  const replay = await env.DB.prepare(
    `SELECT ${SHARE_COLUMNS} FROM shares
     WHERE user_id = ? AND idempotency_key = ?`,
  )
    .bind(user.id, requestKey)
    .first<ShareRow>();
  if (replay) return json({ share: response(replay, env.PUBLIC_SITE_ORIGIN) });

  const currentEntry = await env.DB.prepare(
    `SELECT ${SHARE_COLUMNS} FROM shares
     WHERE user_id = ? AND entry_id = ? AND status = 'active' LIMIT 1`,
  )
    .bind(user.id, input.entryId)
    .first<ShareRow>();
  if (currentEntry) {
    return error(409, "already_published", "This note is already published.", {
      share: response(currentEntry, env.PUBLIC_SITE_ORIGIN),
    });
  }

  if (user.plan === "free") {
    const active = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM shares WHERE user_id = ? AND status = 'active'",
    )
      .bind(user.id)
      .first<{ count: number }>();
    if ((active?.count ?? 0) >= 1) {
    return error(
      402,
      "cloud_subscription_required",
      "The free plan includes one published note. Upgrade to Markd Cloud to publish more.",
      { upgradeUrl: `${env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "")}/login?intent=upgrade` },
    );
    }
  }

  const id = newId("share");
  const slug = randomSlug();
  const contentHash = await sha256(input.markdown);
  const objectKey = `shares/${id}/${contentHash}.md`;
  const now = Date.now();

  await env.PUBLISHED_NOTES.put(objectKey, input.markdown, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: { shareId: id, contentHash },
  });

  try {
    await env.DB.prepare(
      `INSERT INTO shares (
        id, entry_id, user_id, slug, title, object_key,
        content_hash, status, idempotency_key, published_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    )
      .bind(
        id,
        input.entryId,
        user.id,
        slug,
        input.title,
        objectKey,
        contentHash,
        requestKey,
        now,
        now,
      )
      .run();
  } catch (cause) {
    await env.PUBLISHED_NOTES.delete(objectKey);
    const message = cause instanceof Error ? cause.message : String(cause);
    if (message.includes("shares.user_id, shares.entry_id")) {
      return error(409, "already_published", "This note is already published.");
    }
    if (message.includes("free_share_limit")) {
      return error(
        402,
        "cloud_subscription_required",
        "The free plan includes one published note. Upgrade to Markd Cloud to publish more.",
        { upgradeUrl: `${env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "")}/login?intent=upgrade` },
      );
    }
    throw cause;
  }

  const row: ShareRow = {
    id,
    entry_id: input.entryId,
    user_id: user.id,
    slug,
    title: input.title,
    object_key: objectKey,
    content_hash: contentHash,
    status: "active",
    idempotency_key: requestKey,
    published_at: now,
    updated_at: now,
    revoked_at: null,
  };
  return json({ share: response(row, env.PUBLIC_SITE_ORIGIN) }, 201);
}

export async function getOwnedShare(
  request: Request,
  env: Env,
  shareId: string,
): Promise<Response> {
  const user = await authenticatedUser(request, env);
  const row = await findOwnedShare(env, shareId, user.id);
  return row
    ? json({ share: response(row, env.PUBLIC_SITE_ORIGIN) })
    : notFound();
}

export async function updateShare(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  shareId: string,
): Promise<Response> {
  const user = await authenticatedUser(request, env);
  idempotencyKey(request);
  const input = publishInput(await readJson(request, MAX_REQUEST_BYTES));
  const current = await findOwnedShare(env, shareId, user.id);
  if (!current || current.entry_id !== input.entryId) return notFound();

  const contentHash = await sha256(input.markdown);
  if (contentHash === current.content_hash && input.title === current.title) {
    return json({ share: response(current, env.PUBLIC_SITE_ORIGIN) });
  }

  const objectKey = `shares/${shareId}/${contentHash}.md`;
  const now = Date.now();
  await env.PUBLISHED_NOTES.put(objectKey, input.markdown, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: { shareId, contentHash },
  });

  try {
    const result = await env.DB.prepare(
      `UPDATE shares
       SET title = ?, object_key = ?, content_hash = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND status = 'active'`,
    )
      .bind(input.title, objectKey, contentHash, now, shareId, user.id)
      .run();
    if (result.meta.changes !== 1) {
      await env.PUBLISHED_NOTES.delete(objectKey);
      return notFound();
    }
  } catch (cause) {
    await env.PUBLISHED_NOTES.delete(objectKey);
    throw cause;
  }

  if (current.object_key !== objectKey) {
    ctx.waitUntil(env.PUBLISHED_NOTES.delete(current.object_key));
  }
  return json({
    share: response(
      {
        ...current,
        title: input.title,
        object_key: objectKey,
        content_hash: contentHash,
        updated_at: now,
      },
      env.PUBLIC_SITE_ORIGIN,
    ),
  });
}

export async function revokeShare(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  shareId: string,
): Promise<Response> {
  const user = await authenticatedUser(request, env);
  const current = await findOwnedShare(env, shareId, user.id);
  if (!current) return notFound();

  const now = Date.now();
  const result = await env.DB.prepare(
    `UPDATE shares SET status = 'revoked', revoked_at = ?, updated_at = ?
     WHERE id = ? AND user_id = ? AND status = 'active'`,
  )
    .bind(now, now, shareId, user.id)
    .run();
  if (result.meta.changes !== 1) return notFound();
  ctx.waitUntil(env.PUBLISHED_NOTES.delete(current.object_key));
  return new Response(null, { status: 204 });
}

export async function getPublicShare(
  env: Env,
  slug: string,
): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT ${SHARE_COLUMNS} FROM shares
     WHERE slug = ? AND status = 'active'`,
  )
    .bind(slug)
    .first<ShareRow>();
  if (!row) return notFound();

  const object = await env.PUBLISHED_NOTES.get(row.object_key);
  if (!object?.body) return notFound();
  const markdown = await object.text();
  return json({
    title: row.title,
    markdown,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  });
}
