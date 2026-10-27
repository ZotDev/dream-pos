-- Database-backed RBAC foundation. Existing app_users.role values remain the compatibility role keys.
CREATE TABLE IF NOT EXISTS app_roles (
  id BIGSERIAL PRIMARY KEY,
  role_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  organization_id BIGINT REFERENCES saas_tenants(id) ON DELETE CASCADE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS app_roles_scope_key_uq ON app_roles ((COALESCE(organization_id,0)), role_key);
CREATE TABLE IF NOT EXISTS app_permissions (
  id BIGSERIAL PRIMARY KEY,
  permission_key TEXT NOT NULL UNIQUE,
  module_key TEXT NOT NULL,
  action_key TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app_role_permissions (
  role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES app_permissions(id) ON DELETE CASCADE,
  granted_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE IF NOT EXISTS app_user_role_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
  organization_id BIGINT REFERENCES saas_tenants(id) ON DELETE CASCADE,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  assigned_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS app_user_role_scope_uq ON app_user_role_assignments
  (user_id, role_id, COALESCE(organization_id,0), COALESCE(store_id,0), COALESCE(warehouse_id,0));
CREATE INDEX IF NOT EXISTS app_user_role_assignments_user_idx ON app_user_role_assignments(user_id, is_active);
CREATE INDEX IF NOT EXISTS app_role_permissions_permission_idx ON app_role_permissions(permission_id);

INSERT INTO app_permissions(permission_key,module_key,action_key,description,is_sensitive)
SELECT 'module.'||m.module_key||'.view',m.module_key,'view','View '||m.module_name,false
FROM (VALUES
 ('overview','Overview'),('pos','POS Billing'),('sales','Sales History'),('returns','Returns & Exchanges'),
 ('quotations','Quotations'),('deliveries','Deliveries'),('products','Products'),('categories','Categories'),
 ('inventory','Inventory'),('warehouse','Warehouse'),('warehouse_stock','Warehouse Stock'),
 ('warehouse_transfers','Warehouse Transfers'),('purchases','Purchases'),('suppliers','Suppliers'),
 ('customers','Customers'),('invoices','Invoices'),('expenses','Expenses & Finance'),('accounting','Accounting'),
 ('reports','Reports & Analytics'),('attendance','Attendance'),('leave','Leave Management'),
 ('employees','Employees'),('tasks','Tasks'),('payroll','HRM & Payroll'),('users','Users & Roles'),
 ('stores','Stores'),('audit','Audit Log'),('saas','SaaS Super Admin'),
 ('gst_tax_reports','GST & Tax Reports'),('compliance_documents','Compliance Documents')
) m(module_key,module_name)
ON CONFLICT(permission_key) DO NOTHING;

INSERT INTO app_permissions(permission_key,module_key,action_key,description,is_sensitive)
VALUES
 ('roles.view','users','view','View role definitions',false),
 ('roles.create','users','create','Create custom roles',true),
 ('roles.update','users','update','Edit custom role grants',true),
 ('roles.assign','users','assign','Assign roles and scopes',true),
 ('audit_logs.view','audit','view','View security audit logs',true),
 ('invoices.print','invoices','print','Print invoice documents',false),
 ('invoices.download','invoices','download','Download invoice documents',false),
 ('reports.export','reports','export','Export business reports',true),
 ('tax.reports.view','gst_tax_reports','view','View GST reconciliation reports',true),
 ('hr.payroll.view_sensitive','payroll','view_sensitive','View sensitive payroll data',true)
ON CONFLICT(permission_key) DO NOTHING;

INSERT INTO app_roles(role_key,name,description,is_system)
VALUES
 ('super_admin','Super Admin','Platform operations; business-data access remains explicitly scoped.',true),
 ('admin','Admin','Organization administration within assigned business scope.',true),
 ('manager','Manager','Operational manager with assigned module grants.',true),
 ('cashier','Cashier','POS and permitted customer/invoice operations.',true),
 ('inventory_manager','Inventory Manager','Inventory, purchasing and stock operations.',true),
 ('store_keeper','Store Keeper','Warehouse and stock handling.',true),
 ('salesman','Salesman','Sales, quotations and assigned customer operations.',true),
 ('supervisor','Supervisor','Assigned operational supervision.',true),
 ('delivery_biker','Delivery Biker','Assigned delivery operations.',true),
 ('employee','Employee','Self-service and assigned tasks.',true),
 ('accountant','Accountant','Accounting and financial reporting.',true),
 ('hr_manager','HR Manager','HR, attendance and payroll workflows.',true)
ON CONFLICT DO NOTHING;

WITH grants(role_key,module_key) AS (
 SELECT r.role_key, m.module_key
 FROM (VALUES
 ('super_admin','overview'),('super_admin','pos'),('super_admin','sales'),('super_admin','returns'),('super_admin','quotations'),('super_admin','deliveries'),('super_admin','products'),('super_admin','categories'),('super_admin','inventory'),('super_admin','warehouse'),('super_admin','warehouse_stock'),('super_admin','warehouse_transfers'),('super_admin','purchases'),('super_admin','suppliers'),('super_admin','customers'),('super_admin','invoices'),('super_admin','expenses'),('super_admin','accounting'),('super_admin','reports'),('super_admin','attendance'),('super_admin','leave'),('super_admin','employees'),('super_admin','tasks'),('super_admin','payroll'),('super_admin','users'),('super_admin','stores'),('super_admin','audit'),('super_admin','saas'),('super_admin','gst_tax_reports'),('super_admin','compliance_documents'),
 ('admin','overview'),('admin','pos'),('admin','sales'),('admin','returns'),('admin','quotations'),('admin','deliveries'),('admin','products'),('admin','categories'),('admin','inventory'),('admin','warehouse'),('admin','warehouse_stock'),('admin','warehouse_transfers'),('admin','purchases'),('admin','suppliers'),('admin','customers'),('admin','invoices'),('admin','expenses'),('admin','accounting'),('admin','reports'),('admin','attendance'),('admin','leave'),('admin','employees'),('admin','tasks'),('admin','payroll'),('admin','users'),('admin','stores'),('admin','audit'),('admin','gst_tax_reports'),('admin','compliance_documents'),
 ('manager','overview'),('manager','pos'),('manager','sales'),('manager','returns'),('manager','quotations'),('manager','deliveries'),('manager','products'),('manager','inventory'),('manager','warehouse'),('manager','warehouse_transfers'),('manager','purchases'),('manager','suppliers'),('manager','customers'),('manager','invoices'),('manager','expenses'),('manager','reports'),('manager','attendance'),('manager','leave'),('manager','tasks'),('manager','gst_tax_reports'),('manager','compliance_documents'),
 ('cashier','overview'),('cashier','pos'),('cashier','sales'),('cashier','returns'),('cashier','customers'),('cashier','invoices'),
 ('inventory_manager','overview'),('inventory_manager','products'),('inventory_manager','categories'),('inventory_manager','inventory'),('inventory_manager','warehouse'),('inventory_manager','warehouse_stock'),('inventory_manager','warehouse_transfers'),('inventory_manager','purchases'),('inventory_manager','suppliers'),('inventory_manager','reports'),
 ('store_keeper','overview'),('store_keeper','products'),('store_keeper','inventory'),('store_keeper','warehouse'),('store_keeper','warehouse_stock'),('store_keeper','warehouse_transfers'),
 ('salesman','overview'),('salesman','pos'),('salesman','sales'),('salesman','quotations'),('salesman','deliveries'),('salesman','customers'),('salesman','invoices'),
 ('supervisor','overview'),('supervisor','pos'),('supervisor','inventory'),('supervisor','warehouse'),('supervisor','warehouse_transfers'),('supervisor','attendance'),('supervisor','leave'),('supervisor','tasks'),('supervisor','deliveries'),
 ('delivery_biker','overview'),('delivery_biker','deliveries'),('delivery_biker','tasks'),
 ('employee','overview'),('employee','attendance'),('employee','leave'),('employee','tasks'),
 ('accountant','overview'),('accountant','purchases'),('accountant','invoices'),('accountant','expenses'),('accountant','accounting'),('accountant','reports'),('accountant','payroll'),('accountant','gst_tax_reports'),('accountant','compliance_documents'),
 ('hr_manager','overview'),('hr_manager','attendance'),('hr_manager','leave'),('hr_manager','employees'),('hr_manager','payroll'),('hr_manager','tasks')
 ) g(role_key,module_key)
)
INSERT INTO app_role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM grants g JOIN app_roles r ON r.role_key=g.role_key AND r.organization_id IS NULL
JOIN app_permissions p ON p.permission_key='module.'||g.module_key||'.view'
ON CONFLICT DO NOTHING;

-- Existing users retain app_users.role as source of identity. Explicit assignments enable scoped roles.
INSERT INTO app_user_role_assignments(user_id,role_id,store_id)
SELECT u.id,r.id,u.store_id FROM app_users u JOIN app_roles r ON r.role_key=u.role AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;
