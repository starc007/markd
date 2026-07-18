PRAGMA foreign_keys = ON;

CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  current_release_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE UNIQUE INDEX sites_owner_entry ON sites(user_id, entry_id);
CREATE INDEX sites_public_slug ON sites(slug);

CREATE TABLE publish_sessions (
  id TEXT PRIMARY KEY,
  site_id TEXT,
  entry_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  manifest_key TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX publish_sessions_expiry ON publish_sessions(expires_at);

CREATE TABLE publish_session_objects (
  session_id TEXT NOT NULL REFERENCES publish_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  PRIMARY KEY (session_id, content_hash)
) STRICT;

CREATE INDEX publish_session_objects_lookup
  ON publish_session_objects(user_id, content_hash);

CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  manifest_key TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  asset_count INTEGER NOT NULL,
  published_at INTEGER NOT NULL
) STRICT;

CREATE TABLE stored_objects (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  object_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('page', 'asset')),
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, content_hash)
) STRICT;

CREATE TABLE release_objects (
  release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  PRIMARY KEY (release_id, content_hash),
  FOREIGN KEY (user_id, content_hash)
    REFERENCES stored_objects(user_id, content_hash) ON DELETE CASCADE
) STRICT;

CREATE INDEX release_objects_lookup ON release_objects(user_id, content_hash);

CREATE TABLE legacy_publish_objects (
  object_key TEXT PRIMARY KEY
) STRICT;

INSERT OR IGNORE INTO legacy_publish_objects (object_key)
SELECT object_key FROM shares;

DROP TRIGGER IF EXISTS shares_free_limit_before_insert;
DROP TABLE IF EXISTS shares;
