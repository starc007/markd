const CLOUD_API = process.env.MARKD_CLOUD_API_URL ?? "https://api.usemarkd.app";

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 4_096) {
    return Response.json(
      { error: { code: "payload_too_large", message: "The checkout request is too large." } },
      { status: 413 },
    );
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 4_096) {
    return Response.json(
      { error: { code: "payload_too_large", message: "The checkout request is too large." } },
      { status: 413 },
    );
  }
  const response = await fetch(`${CLOUD_API.replace(/\/$/, "")}/v1/billing/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
