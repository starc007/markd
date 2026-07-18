import type {
  BeginPublishInput,
  PublishManifest,
  PublishObjectInput,
  PublishObjectKind,
  PublishPageInput,
} from "./types";

export const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const MAX_PUBLISHED_PAGES = 2_000;
const MAX_PUBLISHED_OBJECTS = 5_000;
const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const MAX_ASSET_BYTES = 100 * 1024 * 1024;
const MAX_RELEASE_BYTES = 2 * 1024 * 1024 * 1024;
const ENTRY_PATTERN = /^entry_[a-zA-Z0-9_-]{16,80}$/;
const SITE_PATTERN = /^site_[a-f0-9]{32}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const PAGE_PATH_PATTERN = /^(?:[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*)?$/;
const SAFE_ASSET_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
]);

export class ValidationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function beginPublishInput(value: unknown): BeginPublishInput {
  if (!value || typeof value !== "object") invalid("Publish details are required.");
  const input = value as Record<string, unknown>;
  const siteId = typeof input.siteId === "string" ? input.siteId : undefined;
  const entryId = typeof input.entryId === "string" ? input.entryId : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";

  if (siteId && !SITE_PATTERN.test(siteId)) invalid("The published site is invalid.");
  if (!ENTRY_PATTERN.test(entryId)) invalid("The note identifier is invalid.");
  if (!title || title.length > 200) invalid("The site title must be between 1 and 200 characters.");

  return { siteId, entryId, title, manifest: publishManifest(input.manifest, entryId) };
}

export function publishManifest(value: unknown, rootEntryId: string): PublishManifest {
  if (!value || typeof value !== "object") invalid("A release manifest is required.");
  const raw = value as Record<string, unknown>;
  const pages = Array.isArray(raw.pages) ? raw.pages.map(pageInput) : [];
  const objects = Array.isArray(raw.objects) ? raw.objects.map(objectInput) : [];
  if (raw.version !== 1) invalid("The release manifest version is unsupported.");
  if (raw.rootEntryId !== rootEntryId) invalid("The release root does not match the site.");
  if (!pages.length || pages.length > MAX_PUBLISHED_PAGES) invalid("The site has an invalid number of pages.");
  if (!objects.length || objects.length > MAX_PUBLISHED_OBJECTS) invalid("The site has an invalid number of objects.");

  const paths = new Set<string>();
  const entries = new Set<string>();
  const hashes = new Map<string, PublishObjectInput>();
  let totalBytes = 0;
  for (const object of objects) {
    const existing = hashes.get(object.hash);
    if (existing && (existing.kind !== object.kind || existing.size !== object.size || existing.contentType !== object.contentType)) {
      invalid("A release object hash has conflicting metadata.");
    }
    hashes.set(object.hash, object);
    totalBytes += existing ? 0 : object.size;
  }
  if (totalBytes > MAX_RELEASE_BYTES) invalid("The published site is too large.");

  for (const page of pages) {
    if (paths.has(page.path) || entries.has(page.entryId)) invalid("A page is included more than once.");
    paths.add(page.path);
    entries.add(page.entryId);
    if (hashes.get(page.objectHash)?.kind !== "page") invalid("A page object is missing from the release.");
  }
  if (!paths.has("") || !entries.has(rootEntryId)) invalid("The release root page is missing.");
  return { version: 1, rootEntryId, pages, objects: [...hashes.values()] };
}

function pageInput(value: unknown): PublishPageInput {
  if (!value || typeof value !== "object") invalid("Page details are invalid.");
  const page = value as Record<string, unknown>;
  const entryId = typeof page.entryId === "string" ? page.entryId : "";
  const path = typeof page.path === "string" ? page.path : "";
  const title = typeof page.title === "string" ? page.title.trim() : "";
  const objectHash = typeof page.objectHash === "string" ? page.objectHash : "";
  if (!ENTRY_PATTERN.test(entryId) || !PAGE_PATH_PATTERN.test(path) || !HASH_PATTERN.test(objectHash)) invalid("Page details are invalid.");
  if (!title || title.length > 200) invalid("Every page needs a valid title.");
  return { entryId, path, title, objectHash };
}

function objectInput(value: unknown): PublishObjectInput {
  if (!value || typeof value !== "object") invalid("Release object details are invalid.");
  const object = value as Record<string, unknown>;
  const hash = typeof object.hash === "string" ? object.hash : "";
  const kind = object.kind === "page" || object.kind === "asset" ? object.kind : "";
  const contentType = typeof object.contentType === "string" ? object.contentType.toLowerCase() : "";
  const size = typeof object.size === "number" && Number.isSafeInteger(object.size) ? object.size : -1;
  if (!HASH_PATTERN.test(hash) || !kind || size < 1) invalid("Release object details are invalid.");
  validateObject(kind, contentType, size);
  return { hash, kind: kind as PublishObjectKind, contentType, size };
}

function validateObject(kind: PublishObjectKind, contentType: string, size: number) {
  if (kind === "page" && (contentType !== "text/markdown; charset=utf-8" || size > MAX_PAGE_BYTES)) {
    invalid("Published pages must be Markdown and no larger than 2 MB.");
  }
  if (kind === "asset" && (!SAFE_ASSET_TYPES.has(contentType) || size > MAX_ASSET_BYTES)) {
    invalid("Published images must be PNG, JPEG, GIF, WebP, or AVIF and no larger than 100 MB.");
  }
}

function invalid(message: string): never {
  throw new ValidationError("invalid_publish_request", message);
}
