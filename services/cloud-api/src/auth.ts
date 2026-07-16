import { sha256 } from "./crypto";
import { error } from "./http";
import type { AccountPlan, AuthenticatedUser, Env } from "./types";

interface SessionRow {
  user_id: string;
  email: string;
  plan: AccountPlan | null;
}

export class AuthenticationError extends Error {}

export async function authenticatedUser(
  request: Request,
  env: Env,
): Promise<AuthenticatedUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(authorization);
  if (!match) throw new AuthenticationError();

  const row = await env.DB.prepare(
    `SELECT users.id AS user_id, users.email, entitlements.plan
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     LEFT JOIN entitlements ON entitlements.user_id = users.id
       AND entitlements.status IN ('active', 'trialing')
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
  )
    .bind(await sha256(match[1]), Date.now())
    .first<SessionRow>();
  if (!row) throw new AuthenticationError();

  return { id: row.user_id, email: row.email, plan: row.plan ?? "free" };
}

export function authenticationRequired(): Response {
  return error(401, "login_required", "Sign in to Markd before publishing a note.");
}
