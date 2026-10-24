CREATE TABLE IF NOT EXISTS delivery_jobs (
 id BIGSERIAL PRIMARY KEY,
 delivery_no TEXT NOT NULL UNIQUE,
 sale_id BIGINT REFERENCES sales(id) ON DELETE SET NULL,
 customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
 assigned_to BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','assigned','picked_up','in_transit','delivered','failed','cancelled')),
 delivery_address TEXT NOT NULL,
 customer_phone TEXT,
 notes TEXT,
 assigned_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
 picked_up_at TIMESTAMPTZ,
 delivered_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_assignee ON delivery_jobs(assigned_to,status);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_created ON delivery_jobs(created_at DESC);
