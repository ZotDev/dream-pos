-- Store-scope customer and supplier records.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
UPDATE customers SET store_id=(SELECT id FROM stores ORDER BY id LIMIT 1) WHERE store_id IS NULL AND EXISTS (SELECT 1 FROM stores);
UPDATE suppliers SET store_id=(SELECT id FROM stores ORDER BY id LIMIT 1) WHERE store_id IS NULL AND EXISTS (SELECT 1 FROM stores);
CREATE INDEX IF NOT EXISTS customers_store_name_idx ON customers(store_id,name);
CREATE INDEX IF NOT EXISTS suppliers_store_name_idx ON suppliers(store_id,name);
