-- Store scoping additions for previously created operational records.
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_store_created ON quotations(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_store_created ON delivery_jobs(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_store_created ON tasks(store_id,created_at DESC);
