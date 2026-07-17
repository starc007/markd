export interface Env {
  DB: D1Database;
  PUBLISHED_NOTES: R2Bucket;
  EMAIL: SendEmail;
  PUBLIC_SITE_ORIGIN: string;
  OTP_PEPPER: string;
}

export interface PublishInput {
  entryId: string;
  title: string;
  markdown: string;
}

export type AccountPlan = "free" | "cloud";

export interface AuthenticatedUser {
  id: string;
  email: string;
  plan: AccountPlan;
}

export interface ShareRow {
  id: string;
  entry_id: string;
  user_id: string;
  slug: string;
  title: string;
  object_key: string;
  content_hash: string;
  status: "active" | "revoked";
  idempotency_key: string;
  published_at: number;
  updated_at: number;
  revoked_at: number | null;
}

export interface ShareResponse {
  id: string;
  entryId: string;
  slug: string;
  url: string;
  title: string;
  contentHash: string;
  publishedAt: number;
  updatedAt: number;
}
