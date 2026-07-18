import { authenticatedUser } from "./auth";
import { newId, randomSlug, sha256 } from "./crypto";
import { error, json, notFound, readJson } from "./http";
import { presignedPutUrl } from "./r2-signing";
import type {
  BeginPublishInput,
  Env,
  PublishManifest,
  PublishObjectInput,
  PublishSessionRow,
  ReleaseRow,
  SiteResponse,
  SiteRow,
} from "./types";
import { beginPublishInput, MAX_REQUEST_BYTES } from "./validation";

const SITE_COLUMNS = `
  id, entry_id, user_id, slug, title, current_release_id, created_at, updated_at
`;
const SESSION_TTL_MS = 20 * 60 * 1000;

export async function beginPublish(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedUser(request, env);
  requirePaid(user.plan, env);
  const input = beginPublishInput(await readJson(request, MAX_REQUEST_BYTES));
  const current = await ownedSiteForInput(env, user.id, input);
  if (input.siteId && (!current || current.entry_id !== input.entryId)) return notFound();
  const sessionId = newId("publish");
  const now = Date.now();
  const manifestJson = JSON.stringify(input.manifest);
  const manifestHash = await sha256(manifestJson);
  const manifestKey = `staging/${user.id}/${sessionId}/manifest.json`;

  await env.PUBLISHED_NOTES.put(manifestKey, manifestJson, {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: { userId: user.id, manifestHash },
  });

  try {
    await env.DB.prepare(
      `INSERT INTO publish_sessions (
        id, site_id, entry_id, user_id, title, manifest_key,
        manifest_hash, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        sessionId,
        current?.id ?? null,
        input.entryId,
        user.id,
        input.title,
        manifestKey,
        manifestHash,
        now + SESSION_TTL_MS,
        now,
      )
      .run();
    for (let index = 0; index < input.manifest.objects.length; index += 80) {
      await env.DB.batch(
        input.manifest.objects.slice(index, index + 80).map((object) =>
          env.DB.prepare(
            `INSERT INTO publish_session_objects (session_id, user_id, content_hash)
             VALUES (?, ?, ?)`,
          ).bind(sessionId, user.id, object.hash),
        ),
      );
    }
  } catch (cause) {
    await env.PUBLISHED_NOTES.delete(manifestKey);
    await env.DB.prepare("DELETE FROM publish_sessions WHERE id = ?").bind(sessionId).run();
    throw cause;
  }

  const pending: Array<{
    hash: string;
    url: string;
    headers: Record<string, string>;
  } | null> = [];
  for (let index = 0; index < input.manifest.objects.length; index += 50) {
    pending.push(...await Promise.all(
      input.manifest.objects.slice(index, index + 50).map(async (object) => {
        const key = objectKey(user.id, object.hash);
        const existing = await env.PUBLISHED_NOTES.head(key);
        if (objectMatches(existing, object)) return null;
        const checksum = hashBase64(object.hash);
        return {
          hash: object.hash,
          url: await presignedPutUrl(env, key, object.contentType, checksum),
          headers: {
            "content-type": object.contentType,
            "x-amz-checksum-sha256": checksum,
          },
        };
      }),
    ));
  }
  const uploads = pending.filter((upload) => upload !== null);

  return json(
    {
      sessionId,
      siteId: current?.id ?? null,
      expiresAt: now + SESSION_TTL_MS,
      uploads,
    },
    201,
  );
}

export async function finalizePublish(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  sessionId: string,
): Promise<Response> {
  const user = await authenticatedUser(request, env);
  requirePaid(user.plan, env);
  const session = await env.DB.prepare(
    `SELECT id, site_id, entry_id, user_id, title, manifest_key,
            manifest_hash, expires_at, created_at
     FROM publish_sessions WHERE id = ? AND user_id = ?`,
  )
    .bind(sessionId, user.id)
    .first<PublishSessionRow>();
  if (!session || session.expires_at <= Date.now()) return notFound();

  const manifestObject = await env.PUBLISHED_NOTES.get(session.manifest_key);
  if (!manifestObject) return error(409, "publish_session_incomplete", "The release manifest is missing.");
  const manifestJson = await manifestObject.text();
  if ((await sha256(manifestJson)) !== session.manifest_hash) {
    return error(409, "publish_session_invalid", "The release manifest could not be verified.");
  }
  const manifest = JSON.parse(manifestJson) as PublishManifest;
  const missing = await missingObjects(env, user.id, manifest.objects);
  if (missing.length) {
    return error(409, "publish_upload_incomplete", "Some release objects have not finished uploading.", {
      missing,
    });
  }

  const now = Date.now();
  const site = session.site_id
    ? await findOwnedSite(env, session.site_id, user.id)
    : null;
  if (session.site_id && !site) return notFound();
  const siteId = site?.id ?? newId("site");
  const releaseId = newId("release");
  const finalManifestKey = `manifests/${siteId}/${releaseId}.json`;
  const releaseManifest = await enrichImageMetadata(env, user.id, manifest);
  await env.PUBLISHED_NOTES.put(finalManifestKey, JSON.stringify(releaseManifest), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: { siteId, releaseId, manifestHash: session.manifest_hash },
  });

  const pageCount = manifest.pages.length;
  const assetCount = manifest.objects.filter((object) => object.kind === "asset").length;
  const slug = site?.slug ?? randomSlug();
  try {
    await env.DB.batch([
      ...(site
        ? []
        : [
            env.DB.prepare(
              `INSERT INTO sites (
                id, entry_id, user_id, slug, title, current_release_id, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
            ).bind(siteId, session.entry_id, user.id, slug, session.title, now, now),
          ]),
      env.DB.prepare(
        `INSERT INTO releases (
          id, site_id, manifest_key, manifest_hash, page_count, asset_count, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(releaseId, siteId, finalManifestKey, session.manifest_hash, pageCount, assetCount, now),
    ]);

    for (let index = 0; index < manifest.objects.length; index += 40) {
      const statements = manifest.objects.slice(index, index + 40).flatMap((object) => [
        env.DB.prepare(
          `INSERT OR IGNORE INTO stored_objects (
            user_id, content_hash, object_key, kind, content_type, byte_size, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          user.id,
          object.hash,
          objectKey(user.id, object.hash),
          object.kind,
          object.contentType,
          object.size,
          now,
        ),
        env.DB.prepare(
          `INSERT INTO release_objects (release_id, user_id, content_hash)
           VALUES (?, ?, ?)`,
        ).bind(releaseId, user.id, object.hash),
      ]);
      await env.DB.batch(statements);
    }

    await env.DB.batch([
      env.DB.prepare(
        `UPDATE sites SET title = ?, current_release_id = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      ).bind(session.title, releaseId, now, siteId, user.id),
      env.DB.prepare("DELETE FROM publish_sessions WHERE id = ?").bind(session.id),
    ]);
  } catch (cause) {
    await env.PUBLISHED_NOTES.delete(finalManifestKey);
    await env.DB.prepare("DELETE FROM releases WHERE id = ?").bind(releaseId).run();
    if (!site) {
      await env.DB.prepare("DELETE FROM sites WHERE id = ? AND current_release_id IS NULL")
        .bind(siteId)
        .run();
    }
    throw cause;
  }

  ctx.waitUntil(env.PUBLISHED_NOTES.delete(session.manifest_key));
  ctx.waitUntil(pruneReleases(env, siteId, user.id));
  ctx.waitUntil(purgeSiteCache(env, siteId, slug));
  const release: ReleaseRow = {
    id: releaseId,
    site_id: siteId,
    manifest_key: finalManifestKey,
    manifest_hash: session.manifest_hash,
    page_count: pageCount,
    asset_count: assetCount,
    published_at: now,
  };
  const row: SiteRow = {
    id: siteId,
    entry_id: session.entry_id,
    user_id: user.id,
    slug,
    title: session.title,
    current_release_id: releaseId,
    created_at: site?.created_at ?? now,
    updated_at: now,
  };
  return json({ site: siteResponse(env, row, release) }, 201);
}

export async function getOwnedSite(request: Request, env: Env, siteId: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  const site = await findOwnedSite(env, siteId, user.id);
  if (!site?.current_release_id) return notFound();
  const release = await findRelease(env, site.current_release_id);
  return release ? json({ site: siteResponse(env, site, release) }) : notFound();
}

export async function deleteSite(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  siteId: string,
): Promise<Response> {
  const user = await authenticatedUser(request, env);
  const site = await findOwnedSite(env, siteId, user.id);
  if (!site) return notFound();
  const releases = await env.DB.prepare(
    "SELECT id, manifest_key FROM releases WHERE site_id = ?",
  )
    .bind(siteId)
    .all<{ id: string; manifest_key: string }>();
  const hashes = await env.DB.prepare(
    `SELECT DISTINCT release_objects.content_hash
     FROM release_objects JOIN releases ON releases.id = release_objects.release_id
     WHERE releases.site_id = ?`,
  )
    .bind(siteId)
    .all<{ content_hash: string }>();
  await env.DB.prepare("DELETE FROM sites WHERE id = ? AND user_id = ?")
    .bind(siteId, user.id)
    .run();
  ctx.waitUntil(Promise.all([
    Promise.allSettled(
      releases.results.map((release) => env.PUBLISHED_NOTES.delete(release.manifest_key)),
    ).then(() => cleanupOrphans(env, user.id, hashes.results.map((row) => row.content_hash))),
    purgeSiteCache(env, site.id, site.slug),
  ]).then(() => undefined));
  return new Response(null, { status: 204 });
}

export async function getPublicPage(env: Env, slug: string, pagePath = ""): Promise<Response> {
  const resolved = await activeManifest(env, slug);
  if (!resolved) return notFound();
  const page = resolved.manifest.pages.find((candidate) => candidate.path === pagePath);
  if (!page) return notFound();
  const object = await env.PUBLISHED_NOTES.get(objectKey(resolved.site.user_id, page.objectHash));
  if (!object) return notFound();
  return json(
    {
      title: page.title,
      markdown: await object.text(),
      publishedAt: resolved.release.published_at,
      updatedAt: resolved.site.updated_at,
      assetBaseUrl: `${env.PUBLIC_API_ORIGIN.replace(/\/$/, "")}/v1/public/assets/${slug}`,
      assetTypes: Object.fromEntries(
        resolved.manifest.objects
          .filter((object) => object.kind === "asset")
          .map((object) => [object.hash, object.contentType]),
      ),
      assetDimensions: Object.fromEntries(
        resolved.manifest.objects
          .filter((object) => object.kind === "asset" && object.width && object.height)
          .map((object) => [object.hash, { width: object.width, height: object.height }]),
      ),
    },
    200,
    {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
      "cache-tag": `markd-site-${resolved.site.id}`,
    },
  );
}

export async function getPublicAsset(
  request: Request,
  env: Env,
  slug: string,
  hash: string,
): Promise<Response> {
  const resolved = await activeManifest(env, slug);
  if (!resolved) return notFound();
  const asset = resolved.manifest.objects.find(
    (object) => object.hash === hash && object.kind === "asset",
  );
  if (!asset) return notFound();
  const object = await env.PUBLISHED_NOTES.get(objectKey(resolved.site.user_id, hash));
  if (!object) return notFound();
  const width = requestedImageWidth(request);
  if (width && asset.contentType !== "image/gif") {
    const format = requestedImageFormat(request);
    const transformed = await env.IMAGES
      .input(object.body)
      .transform({ width, fit: "scale-down" })
      .output({ format, quality: 82 });
    return assetResponse(
      transformed.response().body,
      transformed.contentType(),
      resolved.site.id,
      `"${hash}-${width}-${format.slice(6)}"`,
    );
  }
  return assetResponse(object.body, asset.contentType, resolved.site.id, object.httpEtag, asset.size);
}

function assetResponse(
  body: ReadableStream<Uint8Array> | null,
  contentType: string,
  siteId: string,
  etag: string,
  size?: number,
) {
  return new Response(body, {
    headers: {
      "content-type": contentType,
      ...(size ? { "content-length": String(size) } : {}),
      "cache-control": "public, max-age=31536000, immutable",
      etag,
      "cache-tag": `markd-site-${siteId}`,
      "x-content-type-options": "nosniff",
    },
  });
}

function requestedImageWidth(request: Request) {
  const width = Number(new URL(request.url).searchParams.get("w"));
  return [320, 640, 960, 1280, 1600].includes(width) ? width : null;
}

function requestedImageFormat(request: Request): "image/avif" | "image/webp" {
  return new URL(request.url).searchParams.get("f") === "avif" ? "image/avif" : "image/webp";
}

async function ownedSiteForInput(env: Env, userId: string, input: BeginPublishInput) {
  if (input.siteId) {
    return findOwnedSite(env, input.siteId, userId);
  }
  return env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE user_id = ? AND entry_id = ?`)
    .bind(userId, input.entryId)
    .first<SiteRow>();
}

async function findOwnedSite(env: Env, siteId: string, userId: string) {
  return env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE id = ? AND user_id = ?`)
    .bind(siteId, userId)
    .first<SiteRow>();
}

async function findRelease(env: Env, releaseId: string) {
  return env.DB.prepare(
    `SELECT id, site_id, manifest_key, manifest_hash, page_count, asset_count, published_at
     FROM releases WHERE id = ?`,
  )
    .bind(releaseId)
    .first<ReleaseRow>();
}

async function activeManifest(env: Env, slug: string) {
  const site = await env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE slug = ?`)
    .bind(slug)
    .first<SiteRow>();
  if (!site?.current_release_id) return null;
  const release = await findRelease(env, site.current_release_id);
  if (!release) return null;
  const object = await env.PUBLISHED_NOTES.get(release.manifest_key);
  if (!object) return null;
  return { site, release, manifest: JSON.parse(await object.text()) as PublishManifest };
}

async function missingObjects(env: Env, userId: string, objects: PublishObjectInput[]) {
  const results: Array<string | null> = [];
  for (let index = 0; index < objects.length; index += 50) {
    results.push(...await Promise.all(
      objects.slice(index, index + 50).map(async (object) => {
        const stored = await env.PUBLISHED_NOTES.head(objectKey(userId, object.hash));
        return objectMatches(stored, object) ? null : object.hash;
      }),
    ));
  }
  return results.filter((hash): hash is string => Boolean(hash));
}

async function enrichImageMetadata(
  env: Env,
  userId: string,
  manifest: PublishManifest,
): Promise<PublishManifest> {
  const objects: PublishObjectInput[] = [];
  for (let index = 0; index < manifest.objects.length; index += 20) {
    objects.push(...await Promise.all(
      manifest.objects.slice(index, index + 20).map(async (object) => {
        if (object.kind !== "asset") return object;
        const stored = await env.PUBLISHED_NOTES.get(objectKey(userId, object.hash));
        if (!stored) throw new Error(`release image ${object.hash} is missing`);
        const info = await env.IMAGES.info(stored.body);
        if (!("width" in info) || !("height" in info)) return object;
        return { ...object, width: info.width, height: info.height };
      }),
    ));
  }
  return { ...manifest, objects };
}

function objectMatches(object: R2Object | null, expected: PublishObjectInput) {
  if (!object || object.size !== expected.size) return false;
  const digest = object.checksums.sha256;
  return digest ? bytesHex(new Uint8Array(digest)) === expected.hash : false;
}

async function retireRelease(env: Env, releaseId: string, userId: string) {
  const release = await findRelease(env, releaseId);
  if (!release) return;
  const hashes = await env.DB.prepare(
    "SELECT content_hash FROM release_objects WHERE release_id = ?",
  )
    .bind(releaseId)
    .all<{ content_hash: string }>();
  await env.DB.prepare("DELETE FROM releases WHERE id = ?").bind(releaseId).run();
  await env.PUBLISHED_NOTES.delete(release.manifest_key);
  await cleanupOrphans(env, userId, hashes.results.map((row) => row.content_hash));
}

async function pruneReleases(env: Env, siteId: string, userId: string) {
  const releases = await env.DB.prepare(
    `SELECT id FROM releases WHERE site_id = ? ORDER BY published_at DESC LIMIT -1 OFFSET 3`,
  )
    .bind(siteId)
    .all<{ id: string }>();
  for (const release of releases.results) {
    await retireRelease(env, release.id, userId);
  }
}

async function cleanupOrphans(env: Env, userId: string, hashes: string[]) {
  for (const hash of hashes) {
    const referenced = await env.DB.prepare(
      "SELECT 1 AS found FROM release_objects WHERE user_id = ? AND content_hash = ? LIMIT 1",
    )
      .bind(userId, hash)
      .first<{ found: number }>();
    if (referenced) continue;
    await env.PUBLISHED_NOTES.delete(objectKey(userId, hash));
    await env.DB.prepare("DELETE FROM stored_objects WHERE user_id = ? AND content_hash = ?")
      .bind(userId, hash)
      .run();
  }
}

async function purgeSiteCache(env: Env, siteId: string, slug: string) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env.CACHE_ZONE_ID}/purge_cache`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.CACHE_PURGE_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ tags: [`markd-site-${siteId}`, `markd-slug-${slug}`] }),
    },
  );
  if (!response.ok) console.error("Published site cache purge failed", response.status);
}

function siteResponse(env: Env, site: SiteRow, release: ReleaseRow): SiteResponse {
  return {
    id: site.id,
    entryId: site.entry_id,
    slug: site.slug,
    url: `${env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "")}/s/${site.slug}`,
    title: site.title,
    contentHash: release.manifest_hash,
    publishedAt: release.published_at,
    updatedAt: site.updated_at,
    pageCount: release.page_count,
    assetCount: release.asset_count,
  };
}

function requirePaid(plan: string, env: Env): void {
  if (plan === "cloud") return;
  throw new PaidPublishingError(`${env.PUBLIC_SITE_ORIGIN.replace(/\/$/, "")}/login?intent=upgrade`);
}

export class PaidPublishingError extends Error {
  constructor(readonly upgradeUrl: string) {
    super("Publishing is included with Markd Cloud. Upgrade to publish this site.");
  }
}

export async function cleanupExpiredPublishSessions(env: Env) {
  const expired = await env.DB.prepare(
    `SELECT id, user_id, manifest_key FROM publish_sessions
     WHERE expires_at <= ? ORDER BY expires_at LIMIT 100`,
  )
    .bind(Date.now())
    .all<{ id: string; user_id: string; manifest_key: string }>();
  for (const session of expired.results) {
    const hashes = await env.DB.prepare(
      "SELECT content_hash FROM publish_session_objects WHERE session_id = ?",
    )
      .bind(session.id)
      .all<{ content_hash: string }>();
    await env.DB.prepare("DELETE FROM publish_sessions WHERE id = ?").bind(session.id).run();
    await env.PUBLISHED_NOTES.delete(session.manifest_key);
    for (const { content_hash: hash } of hashes.results) {
      const stored = await env.DB.prepare(
        `SELECT 1 AS found FROM stored_objects WHERE user_id = ? AND content_hash = ?
         UNION ALL
         SELECT 1 AS found FROM publish_session_objects WHERE user_id = ? AND content_hash = ?
         LIMIT 1`,
      )
        .bind(session.user_id, hash, session.user_id, hash)
        .first<{ found: number }>();
      if (!stored) await env.PUBLISHED_NOTES.delete(objectKey(session.user_id, hash));
    }
  }
  const legacy = await env.DB.prepare(
    "SELECT object_key FROM legacy_publish_objects LIMIT 100",
  ).all<{ object_key: string }>();
  for (const object of legacy.results) {
    await env.PUBLISHED_NOTES.delete(object.object_key);
    await env.DB.prepare("DELETE FROM legacy_publish_objects WHERE object_key = ?")
      .bind(object.object_key)
      .run();
  }
}

function objectKey(userId: string, hash: string) {
  return `objects/${userId}/${hash}`;
}

function hashBase64(hash: string) {
  let binary = "";
  for (let index = 0; index < hash.length; index += 2) {
    binary += String.fromCharCode(Number.parseInt(hash.slice(index, index + 2), 16));
  }
  return btoa(binary);
}

function bytesHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
