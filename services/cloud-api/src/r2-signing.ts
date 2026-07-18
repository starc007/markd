import { hmacBytes, sha256 } from "./crypto";
import type { Env } from "./types";

const REGION = "auto";
const SERVICE = "s3";

export async function presignedPutUrl(
  env: Env,
  objectKey: string,
  contentType: string,
  checksum: string,
  expiresSeconds = 900,
): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const scope = `${date}/${REGION}/${SERVICE}/aws4_request`;
  const path = `/${encodeSegment(env.R2_BUCKET_NAME)}/${objectKey.split("/").map(encodeSegment).join("/")}`;
  const signedHeaders = "content-type;host;x-amz-checksum-sha256";
  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${env.R2_ACCESS_KEY_ID}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const canonicalQuery = [...query.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeSegment(key)}=${encodeSegment(value)}`)
    .join("&");
  const canonicalHeaders = `content-type:${contentType.trim()}\nhost:${host}\nx-amz-checksum-sha256:${checksum}\n`;
  const canonicalRequest = [
    "PUT",
    path,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256(canonicalRequest),
  ].join("\n");
  const dateKey = await hmacBytes(`AWS4${env.R2_SECRET_ACCESS_KEY}`, date);
  const regionKey = await hmacBytes(dateKey, REGION);
  const serviceKey = await hmacBytes(regionKey, SERVICE);
  const signingKey = await hmacBytes(serviceKey, "aws4_request");
  const signature = toHex(await hmacBytes(signingKey, stringToSign));
  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

function encodeSegment(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function toHex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
