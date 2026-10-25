-- Store-specific inventory ledger foundation. Safe to re-run.
CREATE TABLE IF NOT EXISTS store_inventory (
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, product_id)
);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS store_inventory_product_idx ON store_inventory(product_id,store_id);
CREATE INDEX IF NOT EXISTS stock_movements_store_created_idx ON stock_movements(store_id,created_at DESC);
-- Legacy stock has no store attribution. Assign it to the earliest active store only;
-- do not duplicate the same opening balance into every store.
INSERT INTO store_inventory(store_id,product_id,quantity)
SELECT s.id,p.id,
       CASE WHEN s.id=(SELECT id FROM stores ORDER BY id LIMIT 1) THEN p.stock_qty ELSE 0 END
FROM stores s CROSS JOIN products p
ON CONFLICT(store_id,product_id) DO NOTHING;
