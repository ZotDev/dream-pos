CREATE TABLE IF NOT EXISTS stores (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, address TEXT, phone TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS app_users (id BIGSERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('super_admin','admin','manager','cashier','inventory_manager','store_keeper','salesman','supervisor','delivery_biker','employee','accountant','hr_manager')), store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS categories (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS products (id BIGSERIAL PRIMARY KEY, sku TEXT NOT NULL UNIQUE, barcode TEXT UNIQUE, name TEXT NOT NULL, description TEXT, category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL, unit TEXT NOT NULL DEFAULT 'pcs', cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0), selling_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0), tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0), stock_qty NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0), reorder_level NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0), image_url TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS customers (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE, email TEXT, address TEXT, loyalty_points INTEGER NOT NULL DEFAULT 0, store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS customers_store_name_idx ON customers(store_id,name);
CREATE TABLE IF NOT EXISTS suppliers (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, tax_number TEXT, store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS suppliers_store_name_idx ON suppliers(store_id,name);
CREATE TABLE IF NOT EXISTS sales (id BIGSERIAL PRIMARY KEY, invoice_no TEXT NOT NULL UNIQUE, store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL, cashier_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL, customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL, subtotal NUMERIC(12,2) NOT NULL, tax_total NUMERIC(12,2) NOT NULL DEFAULT 0, discount_total NUMERIC(12,2) NOT NULL DEFAULT 0, grand_total NUMERIC(12,2) NOT NULL, payment_method TEXT NOT NULL DEFAULT 'cash', status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','refunded','voided')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS sale_items (id BIGSERIAL PRIMARY KEY, sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE, product_id BIGINT NOT NULL REFERENCES products(id), product_name TEXT NOT NULL, sku TEXT NOT NULL, quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0), unit_price NUMERIC(12,2) NOT NULL, tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0, line_total NUMERIC(12,2) NOT NULL);
CREATE TABLE IF NOT EXISTS stock_movements (id BIGSERIAL PRIMARY KEY, product_id BIGINT NOT NULL REFERENCES products(id), user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL, store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL, movement_type TEXT NOT NULL CHECK (movement_type IN ('opening','purchase','sale','return','adjustment','transfer')), quantity NUMERIC(12,3) NOT NULL, reference TEXT, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS store_inventory (store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE, product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (store_id,product_id));
CREATE INDEX IF NOT EXISTS store_inventory_product_idx ON store_inventory(product_id,store_id);
CREATE INDEX IF NOT EXISTS stock_movements_store_created_idx ON stock_movements(store_id,created_at DESC);
CREATE TABLE IF NOT EXISTS notifications (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES app_users(id) ON DELETE CASCADE, title TEXT NOT NULL, message TEXT NOT NULL, module TEXT NOT NULL DEFAULT 'Overview', is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx ON notifications(user_id,is_read,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS expenses (
 id BIGSERIAL PRIMARY KEY, expense_no TEXT NOT NULL UNIQUE, category TEXT NOT NULL,
 description TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL CHECK(amount >= 0),
 payment_method TEXT NOT NULL DEFAULT 'cash', store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
 created_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL, expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS purchases (
 id BIGSERIAL PRIMARY KEY, purchase_no TEXT NOT NULL UNIQUE, supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
 store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('draft','ordered','received','cancelled')),
 subtotal NUMERIC(12,2) NOT NULL DEFAULT 0, tax_total NUMERIC(12,2) NOT NULL DEFAULT 0, grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
 created_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS purchase_items (
 id BIGSERIAL PRIMARY KEY, purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
 product_id BIGINT NOT NULL REFERENCES products(id), quantity NUMERIC(12,3) NOT NULL CHECK(quantity > 0),
 unit_cost NUMERIC(12,2) NOT NULL CHECK(unit_cost >= 0), line_total NUMERIC(12,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS quotations (
 id BIGSERIAL PRIMARY KEY, quotation_no TEXT NOT NULL UNIQUE, customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','accepted','rejected','expired')),
 subtotal NUMERIC(12,2) NOT NULL DEFAULT 0, tax_total NUMERIC(12,2) NOT NULL DEFAULT 0, grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
 valid_until DATE, created_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS quotation_items (
 id BIGSERIAL PRIMARY KEY, quotation_id BIGINT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
 product_id BIGINT REFERENCES products(id) ON DELETE SET NULL, item_name TEXT NOT NULL,
 quantity NUMERIC(12,3) NOT NULL CHECK(quantity > 0), unit_price NUMERIC(12,2) NOT NULL CHECK(unit_price >= 0), line_total NUMERIC(12,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS returns (
 id BIGSERIAL PRIMARY KEY, return_no TEXT NOT NULL UNIQUE, sale_id BIGINT NOT NULL REFERENCES sales(id),
 reason TEXT NOT NULL, refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'completed',
 processed_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS return_items (
 id BIGSERIAL PRIMARY KEY, return_id BIGINT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
 product_id BIGINT NOT NULL REFERENCES products(id), quantity NUMERIC(12,3) NOT NULL CHECK(quantity > 0),
 unit_refund NUMERIC(12,2) NOT NULL CHECK(unit_refund >= 0)
);
CREATE TABLE IF NOT EXISTS employees (
 id BIGSERIAL PRIMARY KEY, employee_code TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, email TEXT UNIQUE,
 phone TEXT, department TEXT, job_title TEXT, employment_status TEXT NOT NULL DEFAULT 'active',
 salary NUMERIC(12,2) NOT NULL DEFAULT 0, joined_on DATE, store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS leave_requests (
 id BIGSERIAL PRIMARY KEY, employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
 leave_type TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 reviewed_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(end_date >= start_date)
);
CREATE TABLE IF NOT EXISTS tasks (
 id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, assigned_to BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
 status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','blocked','done')),
 priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
 due_date DATE, created_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
 action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to,status);
