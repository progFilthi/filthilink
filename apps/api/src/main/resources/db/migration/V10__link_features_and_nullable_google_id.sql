-- Email/password signup has no Google subject, so google_id must be nullable.
-- The unique constraint stays: Postgres allows many NULLs in a unique column.
ALTER TABLE users
    ALTER COLUMN google_id DROP NOT NULL;

-- Soft delete keeps deleted links counting toward the monthly limit, so Free users
-- cannot create-and-delete in a loop to get unlimited links. Deleted links are
-- excluded from listing and redirects but still exist for the usage count.
ALTER TABLE links
    ADD deleted_at TIMESTAMP WITHOUT TIME ZONE;

CREATE INDEX idx_links_user_created_at ON links (user_id, created_at);
