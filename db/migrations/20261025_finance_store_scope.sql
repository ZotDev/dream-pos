-- Scope payroll and accounting records to a store.
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
UPDATE payroll_runs pr SET store_id=COALESCE(u.store_id,(SELECT id FROM stores ORDER BY id LIMIT 1)) FROM app_users u WHERE pr.created_by=u.id AND pr.store_id IS NULL;
UPDATE journal_entries je SET store_id=COALESCE(u.store_id,(SELECT id FROM stores ORDER BY id LIMIT 1)) FROM app_users u WHERE je.created_by=u.id AND je.store_id IS NULL;
CREATE INDEX IF NOT EXISTS payroll_runs_store_period_idx ON payroll_runs(store_id,period_start DESC);
CREATE INDEX IF NOT EXISTS journal_entries_store_date_idx ON journal_entries(store_id,entry_date DESC);
