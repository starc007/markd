PRAGMA foreign_keys = ON;

DROP TABLE account_usage_monthly;

CREATE INDEX releases_cleanup
  ON releases(site_id, published_at);

CREATE INDEX sites_incomplete_cleanup
  ON sites(current_release_id, updated_at);

ALTER TABLE legacy_publish_objects
  ADD COLUMN queued_at INTEGER NOT NULL DEFAULT 0;

CREATE INDEX legacy_publish_objects_cleanup
  ON legacy_publish_objects(queued_at);
