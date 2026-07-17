PRAGMA foreign_keys = ON;

CREATE TABLE otp_challenges (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX otp_challenges_email_created
  ON otp_challenges(email, created_at DESC);

CREATE INDEX otp_challenges_fingerprint_created
  ON otp_challenges(request_fingerprint, created_at DESC);

CREATE INDEX otp_challenges_expiry
  ON otp_challenges(expires_at);
