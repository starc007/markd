import { error, json, RequestBodyError } from "./http";
import {
  createShare,
  getOwnedShare,
  getPublicShare,
  revokeShare,
  updateShare,
} from "./shares";
import type { Env } from "./types";
import { ValidationError } from "./validation";
import {
  authenticatedUser,
  AuthenticationError,
  authenticationRequired,
  revokeSession,
} from "./auth";
import { OtpError, requestOtp, verifyOtp } from "./otp";

const SHARE_ID = /^\/v1\/shares\/(share_[a-f0-9]{32})$/;
const PUBLIC_SLUG = /^\/v1\/public\/shares\/([a-zA-Z0-9_-]{20,24})$/;

async function route(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return json({ ok: true });
  }
  if (request.method === "POST" && url.pathname === "/v1/auth/otp/request") {
    return requestOtp(request, env);
  }
  if (request.method === "POST" && url.pathname === "/v1/auth/otp/verify") {
    return verifyOtp(request, env);
  }
  if (request.method === "DELETE" && url.pathname === "/v1/session") {
    return revokeSession(request, env);
  }
  if (request.method === "GET" && url.pathname === "/v1/me") {
    const user = await authenticatedUser(request, env);
    return json({ user: { id: user.id, email: user.email, plan: user.plan } });
  }
  if (request.method === "POST" && url.pathname === "/v1/shares") {
    return createShare(request, env);
  }

  const publicMatch = PUBLIC_SLUG.exec(url.pathname);
  if (request.method === "GET" && publicMatch) {
    return getPublicShare(env, publicMatch[1]);
  }

  const shareMatch = SHARE_ID.exec(url.pathname);
  if (shareMatch) {
    if (request.method === "GET") {
      return getOwnedShare(request, env, shareMatch[1]);
    }
    if (request.method === "PUT") {
      return updateShare(request, env, ctx, shareMatch[1]);
    }
    if (request.method === "DELETE") {
      return revokeShare(request, env, ctx, shareMatch[1]);
    }
  }

  return error(404, "route_not_found", "The requested endpoint does not exist.");
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await route(request, env, ctx);
    } catch (cause) {
      if (cause instanceof AuthenticationError) return authenticationRequired();
      if (cause instanceof OtpError) return error(cause.status, cause.code, cause.message);
      if (cause instanceof ValidationError) {
        return error(400, cause.code, cause.message);
      }
      if (cause instanceof RequestBodyError) {
        return error(cause.status, cause.code, cause.message);
      }
      console.error("Unhandled publishing API error", cause);
      return error(500, "internal_error", "The publishing service could not complete the request.");
    }
  },
} satisfies ExportedHandler<Env>;
