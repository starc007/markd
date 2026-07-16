import type { PublishInput } from "./types";

export const MAX_REQUEST_BYTES = 600 * 1024;
export const MAX_MARKDOWN_BYTES = 512 * 1024;
const ENTRY_PATTERN = /^entry_[a-zA-Z0-9_-]{16,80}$/;
const IDEMPOTENCY_PATTERN = /^[a-zA-Z0-9_-]{16,100}$/;

export class ValidationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function idempotencyKey(request: Request): string {
  const key = request.headers.get("idempotency-key") ?? "";
  if (!IDEMPOTENCY_PATTERN.test(key)) {
    throw new ValidationError(
      "invalid_idempotency_key",
      "A valid idempotency key is required.",
    );
  }
  return key;
}

export function publishInput(value: unknown): PublishInput {
  if (!value || typeof value !== "object") {
    throw new ValidationError("invalid_publish_request", "Publish details are required.");
  }
  const input = value as Record<string, unknown>;
  const entryId = typeof input.entryId === "string" ? input.entryId : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const markdown = typeof input.markdown === "string" ? input.markdown : "";

  if (!ENTRY_PATTERN.test(entryId)) {
    throw new ValidationError("invalid_entry_id", "The note identifier is invalid.");
  }
  if (!title || title.length > 200) {
    throw new ValidationError(
      "invalid_title",
      "The published title must be between 1 and 200 characters.",
    );
  }
  if (!markdown.trim()) {
    throw new ValidationError("empty_note", "An empty note cannot be published.");
  }
  if (new TextEncoder().encode(markdown).byteLength > MAX_MARKDOWN_BYTES) {
    throw new ValidationError(
      "note_too_large",
      "Published Markdown must be 512 KB or smaller.",
    );
  }
  return { entryId, title, markdown };
}
