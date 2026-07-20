PRAGMA foreign_keys = ON;

CREATE TABLE account_usage_monthly (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_start INTEGER NOT NULL,
  publish_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month_start)
) STRICT;
