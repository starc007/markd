PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE entitlements (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'cloud')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')) DEFAULT 'active',
  current_period_end INTEGER
) STRICT;

CREATE TABLE shares (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  object_key TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  idempotency_key TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revoked_at INTEGER
) STRICT;

CREATE UNIQUE INDEX shares_owner_idempotency
  ON shares(user_id, idempotency_key);

CREATE UNIQUE INDEX shares_active_entry
  ON shares(user_id, entry_id)
  WHERE status = 'active';

CREATE INDEX shares_public_slug
  ON shares(slug, status);

CREATE INDEX sessions_token_expiry
  ON sessions(token_hash, expires_at);

CREATE TRIGGER shares_free_limit_before_insert
BEFORE INSERT ON shares
WHEN NEW.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM entitlements
    WHERE user_id = NEW.user_id
      AND plan = 'cloud'
      AND status IN ('active', 'trialing')
  )
  AND EXISTS (
    SELECT 1 FROM shares
    WHERE user_id = NEW.user_id AND status = 'active'
  )
BEGIN
  SELECT RAISE(ABORT, 'free_share_limit');
END;
