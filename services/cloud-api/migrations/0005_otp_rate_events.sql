CREATE TABLE otp_rate_events (
  id TEXT PRIMARY KEY,
  email_fingerprint TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX otp_rate_events_email_created
  ON otp_rate_events(email_fingerprint, created_at DESC);

CREATE INDEX otp_rate_events_request_created
  ON otp_rate_events(request_fingerprint, created_at DESC);

CREATE INDEX otp_rate_events_created
  ON otp_rate_events(created_at);

CREATE TRIGGER otp_rate_events_email_limit
BEFORE INSERT ON otp_rate_events
WHEN (
  SELECT COUNT(*) FROM otp_rate_events
  WHERE email_fingerprint = NEW.email_fingerprint
    AND created_at >= NEW.created_at - 3600000
) >= 5
BEGIN
  SELECT RAISE(ABORT, 'otp_email_rate_limit');
END;

CREATE TRIGGER otp_rate_events_request_limit
BEFORE INSERT ON otp_rate_events
WHEN (
  SELECT COUNT(*) FROM otp_rate_events
  WHERE request_fingerprint = NEW.request_fingerprint
    AND created_at >= NEW.created_at - 3600000
) >= 20
BEGIN
  SELECT RAISE(ABORT, 'otp_request_rate_limit');
END;
