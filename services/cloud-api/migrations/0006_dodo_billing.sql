PRAGMA foreign_keys = ON;

ALTER TABLE entitlements ADD COLUMN provider TEXT;
ALTER TABLE entitlements ADD COLUMN provider_customer_id TEXT;
ALTER TABLE entitlements ADD COLUMN provider_subscription_id TEXT;
ALTER TABLE entitlements ADD COLUMN billing_interval TEXT;
ALTER TABLE entitlements ADD COLUMN provider_status TEXT;
ALTER TABLE entitlements ADD COLUMN provider_updated_at INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX entitlements_provider_customer
  ON entitlements(provider, provider_customer_id)
  WHERE provider_customer_id IS NOT NULL;

CREATE UNIQUE INDEX entitlements_provider_subscription
  ON entitlements(provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE TABLE billing_handoffs (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX billing_handoffs_expiry ON billing_handoffs(expires_at);

CREATE TABLE billing_webhooks (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
) STRICT;

