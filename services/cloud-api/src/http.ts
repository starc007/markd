const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
} as const;

export function json(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export function error(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return json({ error: { code, message, ...extra } }, status);
}

export async function readJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new RequestBodyError(413, "payload_too_large", "The request body is too large.");
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new RequestBodyError(400, "invalid_json", "The request body must be valid JSON.");
  }
}

export class RequestBodyError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(): Response {
  return error(404, "not_found", "The published note was not found.");
}
