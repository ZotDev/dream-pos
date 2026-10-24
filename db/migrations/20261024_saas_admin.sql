CREATE TABLE IF NOT EXISTS saas_tenants (
 id BIGSERIAL PRIMARY KEY,
 name TEXT NOT NULL,
 slug TEXT NOT NULL UNIQUE,
 owner_email TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','suspended','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS saas_plans (
 id BIGSERIAL PRIMARY KEY,
 name TEXT NOT NULL,
 code TEXT NOT NULL UNIQUE,
 billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly','yearly')),
 price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
 max_stores INTEGER NOT NULL DEFAULT 1 CHECK (max_stores > 0),
 max_users INTEGER NOT NULL DEFAULT 5 CHECK (max_users > 0),
 max_products INTEGER NOT NULL DEFAULT 1000 CHECK (max_products > 0),
 features JSONB NOT NULL DEFAULT '[]'::jsonb,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS saas_subscriptions (
 id BIGSERIAL PRIMARY KEY,
 tenant_id BIGINT NOT NULL REFERENCES saas_tenants(id) ON DELETE CASCADE,
 plan_id BIGINT NOT NULL REFERENCES saas_plans(id),
 status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','past_due','cancelled')),
 period_start DATE NOT NULL DEFAULT CURRENT_DATE,
 period_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_tenant ON saas_subscriptions(tenant_id,status);
