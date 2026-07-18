import {
  authenticatedUser,
  AuthenticationError,
  authenticationRequired,
  revokeSession,
} from "./auth";
import { error, json, RequestBodyError } from "./http";
import { cleanupExpiredAuthRecords, OtpError, requestOtp, verifyOtp } from "./otp";
import {
  beginPublish,
  cleanupExpiredPublishSessions,
  deleteSite,
  finalizePublish,
  getOwnedSite,
  getPublicAsset,
  getPublicPage,
  PaidPublishingError,
} from "./publishing";
import type { Env } from "./types";
import { ValidationError } from "./validation";

const SITE_ID = /^\/v1\/sites\/(site_[a-f0-9]{32})$/;
const PUBLISH_SESSION = /^\/v1\/publish-sessions\/(publish_[a-f0-9]{32})\/finalize$/;
const PUBLIC_PAGE = /^\/v1\/public\/sites\/([a-zA-Z0-9_-]{20,24})(?:\/pages\/(.+))?$/;
const PUBLIC_ASSET = /^\/v1\/public\/assets\/([a-zA-Z0-9_-]{20,24})\/([a-f0-9]{64})$/;

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return json({ ok: true });
  if (request.method === "POST" && url.pathname === "/v1/auth/otp/request") return requestOtp(request, env);
  if (request.method === "POST" && url.pathname === "/v1/auth/otp/verify") return verifyOtp(request, env);
  if (request.method === "DELETE" && url.pathname === "/v1/session") return revokeSession(request, env);
  if (request.method === "GET" && url.pathname === "/v1/me") {
    const user = await authenticatedUser(request, env);
    return json({ user: { id: user.id, email: user.email, plan: user.plan } });
  }
  if (request.method === "POST" && url.pathname === "/v1/publish-sessions") {
    return beginPublish(request, env);
  }

  const finalize = PUBLISH_SESSION.exec(url.pathname);
  if (request.method === "POST" && finalize) return finalizePublish(request, env, ctx, finalize[1]);

  const publicAsset = PUBLIC_ASSET.exec(url.pathname);
  if (request.method === "GET" && publicAsset) {
    return getPublicAsset(request, env, publicAsset[1], publicAsset[2]);
  }

  const publicPage = PUBLIC_PAGE.exec(url.pathname);
  if (request.method === "GET" && publicPage) {
    return getPublicPage(env, publicPage[1], publicPage[2] ? decodeURIComponent(publicPage[2]) : "");
  }

  const site = SITE_ID.exec(url.pathname);
  if (site) {
    if (request.method === "GET") return getOwnedSite(request, env, site[1]);
    if (request.method === "DELETE") return deleteSite(request, env, ctx, site[1]);
  }
  return error(404, "route_not_found", "The requested endpoint does not exist.");
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await route(request, env, ctx);
    } catch (cause) {
      if (cause instanceof AuthenticationError) return authenticationRequired();
      if (cause instanceof PaidPublishingError) {
        return error(402, "cloud_subscription_required", cause.message, {
          upgradeUrl: cause.upgradeUrl,
        });
      }
      if (cause instanceof OtpError) return error(cause.status, cause.code, cause.message);
      if (cause instanceof ValidationError) return error(400, cause.code, cause.message);
      if (cause instanceof RequestBodyError) return error(cause.status, cause.code, cause.message);
      console.error("Unhandled publishing API error", cause);
      return error(500, "internal_error", "The publishing service could not complete the request.");
    }
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      Promise.all([cleanupExpiredAuthRecords(env), cleanupExpiredPublishSessions(env)]).then(
        () => undefined,
      ),
    );
  },
} satisfies ExportedHandler<Env>;
