export interface Env {
  DB: D1Database;
  PUBLISHED_NOTES: R2Bucket;
  IMAGES: ImagesBinding;
  EMAIL: SendEmail;
  OTP_IP_RATE_LIMITER: RateLimit;
  OTP_EMAIL_RATE_LIMITER: RateLimit;
  PUBLIC_SITE_ORIGIN: string;
  PUBLIC_API_ORIGIN: string;
  OTP_PEPPER: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CACHE_ZONE_ID: string;
  CACHE_PURGE_TOKEN: string;
}

export type AccountPlan = "free" | "cloud";

export interface AuthenticatedUser {
  id: string;
  email: string;
  plan: AccountPlan;
}

export type PublishObjectKind = "page" | "asset";

export interface PublishObjectInput {
  hash: string;
  kind: PublishObjectKind;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface PublishPageInput {
  entryId: string;
  path: string;
  title: string;
  objectHash: string;
}

export interface PublishManifest {
  version: 1;
  rootEntryId: string;
  pages: PublishPageInput[];
  objects: PublishObjectInput[];
}

export interface BeginPublishInput {
  siteId?: string;
  entryId: string;
  title: string;
  manifest: PublishManifest;
}

export interface SiteRow {
  id: string;
  entry_id: string;
  user_id: string;
  slug: string;
  title: string;
  current_release_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface PublishSessionRow {
  id: string;
  site_id: string | null;
  entry_id: string;
  user_id: string;
  title: string;
  manifest_key: string;
  manifest_hash: string;
  expires_at: number;
  created_at: number;
}

export interface ReleaseRow {
  id: string;
  site_id: string;
  manifest_key: string;
  manifest_hash: string;
  page_count: number;
  asset_count: number;
  published_at: number;
}

export interface SiteResponse {
  id: string;
  entryId: string;
  slug: string;
  url: string;
  title: string;
  contentHash: string;
  publishedAt: number;
  updatedAt: number;
  pageCount: number;
  assetCount: number;
}
