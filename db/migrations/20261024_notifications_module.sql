ALTER TABLE notifications ADD COLUMN IF NOT EXISTS module text NOT NULL DEFAULT 'Overview';
CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx ON notifications(user_id,is_read,created_at DESC);
