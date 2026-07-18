import { hmacSha256, newId, randomOtp, randomToken, sha256 } from "./crypto";
import { sendOtpEmail } from "./email";
import { json, readJson } from "./http";
import type { AccountPlan, Env } from "./types";

const OTP_TTL_MS = 5 * 60 * 1_000;
const RESEND_COOLDOWN_MS = 60 * 1_000;
const RATE_WINDOW_MS = 60 * 60 * 1_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const MAX_EMAIL_REQUESTS_PER_HOUR = 5;
const MAX_FINGERPRINT_REQUESTS_PER_HOUR = 20;
const MAX_ATTEMPTS = 5;
const MAX_AUTH_BODY_BYTES = 16 * 1_024;
const CLEANUP_BATCH_SIZE = 5_000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHALLENGE_PATTERN = /^otp_[a-f0-9]{32}$/;
const OTP_PATTERN = /^\d{6}$/;

interface ChallengeRow {
  id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: number;
  consumed_at: number | null;
  created_at: number;
}

interface CountRow {
  count: number;
}

interface UserRow {
  id: string;
  email: string;
  plan: AccountPlan | null;
}

export class OtpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function normalizeEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new OtpError(400, "invalid_email", "Enter a valid email address.");
  }
  return email;
}

function requestFingerprint(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function otpHash(env: Env, challengeId: string, code: string): Promise<string> {
  return hmacSha256(otpPepper(env), `${challengeId}:${code}`);
}

function otpPepper(env: Env): string {
  if (!env.OTP_PEPPER || env.OTP_PEPPER.length < 32) {
    throw new Error("OTP_PEPPER must be configured as a Worker secret");
  }
  return env.OTP_PEPPER;
}

function rateLimited(): OtpError {
  return new OtpError(
    429,
    "otp_rate_limited",
    "Too many sign-in codes were requested. Try again later.",
  );
}

function challengeResponse(challenge: ChallengeRow, now: number): Response {
  return json({
    challengeId: challenge.id,
    email: challenge.email,
    expiresIn: Math.max(0, Math.ceil((challenge.expires_at - now) / 1_000)),
    resendAfter: Math.max(
      0,
      Math.ceil((challenge.created_at + RESEND_COOLDOWN_MS - now) / 1_000),
    ),
  });
}

export async function requestOtp(request: Request, env: Env): Promise<Response> {
  const body = (await readJson(request, MAX_AUTH_BODY_BYTES)) as Record<string, unknown>;
  const email = normalizeEmail(body?.email);
  const now = Date.now();
  const pepper = otpPepper(env);
  const [emailFingerprint, fingerprint] = await Promise.all([
    hmacSha256(pepper, `email:${email}`),
    hmacSha256(pepper, `ip:${requestFingerprint(request)}`),
  ]);
  const ipLimit = await env.OTP_IP_RATE_LIMITER.limit({ key: fingerprint });
  if (!ipLimit.success) throw rateLimited();

  const latest = await env.DB.prepare(
    `SELECT id, email, code_hash, attempts, expires_at, consumed_at, created_at
     FROM otp_challenges
     WHERE email = ? AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(email)
    .first<ChallengeRow>();
  if (latest && latest.created_at + RESEND_COOLDOWN_MS > now && latest.expires_at > now) {
    return challengeResponse(latest, now);
  }

  const emailLimit = await env.OTP_EMAIL_RATE_LIMITER.limit({ key: emailFingerprint });
  if (!emailLimit.success) throw rateLimited();

  const windowStart = now - RATE_WINDOW_MS;
  const [emailCount, fingerprintCount] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) AS count FROM otp_rate_events
       WHERE email_fingerprint = ? AND created_at >= ?`,
    )
      .bind(emailFingerprint, windowStart)
      .first<CountRow>(),
    env.DB.prepare(
      `SELECT COUNT(*) AS count FROM otp_rate_events
       WHERE request_fingerprint = ? AND created_at >= ?`,
    )
      .bind(fingerprint, windowStart)
      .first<CountRow>(),
  ]);
  if (
    (emailCount?.count ?? 0) >= MAX_EMAIL_REQUESTS_PER_HOUR ||
    (fingerprintCount?.count ?? 0) >= MAX_FINGERPRINT_REQUESTS_PER_HOUR
  ) {
    throw rateLimited();
  }

  const id = newId("otp");
  const rateEventId = newId("rate");
  const code = randomOtp();
  const challenge: ChallengeRow = {
    id,
    email,
    code_hash: await otpHash(env, id, code),
    attempts: 0,
    expires_at: now + OTP_TTL_MS,
    consumed_at: null,
    created_at: now,
  };
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO otp_challenges (
          id, email, code_hash, request_fingerprint, attempts, expires_at, created_at
        ) VALUES (?, ?, ?, ?, 0, ?, ?)`,
      ).bind(id, email, challenge.code_hash, fingerprint, challenge.expires_at, now),
      env.DB.prepare(
        `INSERT INTO otp_rate_events (
          id, email_fingerprint, request_fingerprint, created_at
        ) VALUES (?, ?, ?, ?)`,
      ).bind(rateEventId, emailFingerprint, fingerprint, now),
    ]);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    if (message.includes("otp_email_rate_limit") || message.includes("otp_request_rate_limit")) {
      throw rateLimited();
    }
    throw cause;
  }

  try {
    await sendOtpEmail(env, email, code);
  } catch (cause) {
    await env.DB.prepare("DELETE FROM otp_challenges WHERE id = ?").bind(id).run();
    throw cause;
  }
  return challengeResponse(challenge, now);
}

function invalidOtp(): OtpError {
  return new OtpError(
    400,
    "invalid_otp",
    "The code is incorrect or has expired. Request a new code and try again.",
  );
}

export async function verifyOtp(request: Request, env: Env): Promise<Response> {
  const body = (await readJson(request, MAX_AUTH_BODY_BYTES)) as Record<string, unknown>;
  const challengeId = typeof body?.challengeId === "string" ? body.challengeId : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!CHALLENGE_PATTERN.test(challengeId) || !OTP_PATTERN.test(code)) throw invalidOtp();

  const now = Date.now();
  const challenge = await env.DB.prepare(
    `SELECT id, email, code_hash, attempts, expires_at, consumed_at, created_at
     FROM otp_challenges WHERE id = ?`,
  )
    .bind(challengeId)
    .first<ChallengeRow>();
  if (
    !challenge ||
    challenge.consumed_at !== null ||
    challenge.expires_at <= now ||
    challenge.attempts >= MAX_ATTEMPTS
  ) {
    throw invalidOtp();
  }

  const candidateHash = await otpHash(env, challengeId, code);
  if (candidateHash !== challenge.code_hash) {
    await env.DB.prepare(
      "UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ? AND consumed_at IS NULL",
    )
      .bind(challengeId)
      .run();
    throw invalidOtp();
  }

  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (id, email, created_at) VALUES (?, ?, ?)",
  )
    .bind(newId("user"), challenge.email, now)
    .run();
  const user = await env.DB.prepare(
    `SELECT users.id, users.email, entitlements.plan
     FROM users
     LEFT JOIN entitlements ON entitlements.user_id = users.id
       AND entitlements.status IN ('active', 'trialing')
     WHERE users.email = ?`,
  )
    .bind(challenge.email)
    .first<UserRow>();
  if (!user) throw new Error("OTP verification could not create an account");

  const accessToken = randomToken();
  const sessionId = newId("session");
  const expiresAt = now + SESSION_TTL_MS;
  const consumed = await env.DB.prepare(
    `DELETE FROM otp_challenges
     WHERE id = ? AND consumed_at IS NULL AND expires_at > ? AND attempts < ?`,
  )
    .bind(challengeId, now, MAX_ATTEMPTS)
    .run();
  if (consumed.meta.changes !== 1) throw invalidOtp();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, user.id, await sha256(accessToken), expiresAt, now)
    .run();

  return json({
    accessToken,
    expiresAt,
    user: { id: user.id, email: user.email, plan: user.plan ?? "free" },
  });
}

export async function cleanupExpiredAuthRecords(env: Env): Promise<void> {
  const now = Date.now();
  const rateCutoff = now - RATE_WINDOW_MS;
  await env.DB.batch([
    env.DB.prepare(
      `DELETE FROM otp_challenges WHERE id IN (
        SELECT id FROM otp_challenges
        WHERE expires_at <= ? ORDER BY expires_at LIMIT ?
      )`,
    ).bind(now, CLEANUP_BATCH_SIZE),
    env.DB.prepare(
      `DELETE FROM otp_rate_events WHERE id IN (
        SELECT id FROM otp_rate_events
        WHERE created_at < ? ORDER BY created_at LIMIT ?
      )`,
    ).bind(rateCutoff, CLEANUP_BATCH_SIZE),
    env.DB.prepare(
      `DELETE FROM sessions WHERE id IN (
        SELECT id FROM sessions
        WHERE expires_at <= ? ORDER BY expires_at LIMIT ?
      )`,
    ).bind(now, CLEANUP_BATCH_SIZE),
  ]);
}
