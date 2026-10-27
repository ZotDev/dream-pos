import { NextResponse } from 'next/server';
import { requireRole, requireSession } from '@/lib/server/auth';
import type { SessionUser } from '@/lib/server/auth';
import { ROLE_MODULE_ACCESS, ROLE_LABELS, canAccessModule } from '@/lib/permissions';

/** Server adapter over the shared role matrix used by dashboard navigation. */
export const SERVER_ROLE_MODULE_ACCESS: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => [roleKey, ROLE_MODULE_ACCESS[roleLabel] || []]),
);

const MODULE_KEYS: Record<string,string> = {
  'Overview':'overview','POS Billing':'pos','Sales History':'sales','Returns & Exchanges':'returns',
  'Quotations':'quotations','Deliveries':'deliveries','Products':'products','Categories':'categories',
  'Inventory':'inventory','Warehouse':'warehouse','Warehouse Stock':'warehouse_stock',
  'Warehouse Transfers':'warehouse_transfers','Purchases':'purchases','Suppliers':'suppliers',
  'Customers':'customers','Invoices':'invoices','Expenses & Finance':'expenses','Accounting':'accounting',
  'Reports & Analytics':'reports','Attendance':'attendance','Leave Management':'leave',
  'Employees':'employees','Tasks':'tasks','HRM & Payroll':'payroll','Users & Roles':'users',
  'Stores':'stores','Audit Log':'audit','SaaS Super Admin':'saas','GST & Tax Reports':'gst_tax_reports','Compliance Documents':'compliance_documents',
};
export const ROLE_MODULE_KEYS: Record<string,string[]> = Object.fromEntries(
  Object.entries(SERVER_ROLE_MODULE_ACCESS).map(([role, modules]) => [
    role,
    modules.includes('*') ? ['*'] : modules.map(module => MODULE_KEYS[module]).filter((key): key is string => Boolean(key)),
  ]),
);

export function roleCanAccessModule(role: string, module: string): boolean {
  const label = ROLE_LABELS[role];
  return Boolean(label && canAccessModule(label, module));
}
export function roleCanAccessModuleKey(role: string, moduleKey: string): boolean {
  const allowed = ROLE_MODULE_KEYS[role];
  return Boolean(allowed && (allowed.includes('*') || allowed.includes(moduleKey)));
}
export async function requireModule(module: string) {
  const auth = await requireSession();
  if ('error' in auth) return auth;
  const moduleKey = MODULE_KEYS[module];
  if (!moduleKey) return { error: NextResponse.json({ error: 'Unknown protected module' }, { status: 403 }) } as const;
  try {
    // Database-backed grants are authoritative for seeded/system roles and custom roles.
    const grant = await (await import('@/lib/server/db')).db().query(
      `SELECT EXISTS (
         SELECT 1 FROM app_roles r
         JOIN app_role_permissions rp ON rp.role_id=r.id
         JOIN app_permissions p ON p.id=rp.permission_id
         WHERE r.role_key=$1 AND r.organization_id IS NULL AND r.is_active=true
           AND p.permission_key=$2
       ) AS allowed`,
      [auth.user.role, `module.${moduleKey}.view`],
    );
    if (!grant.rows[0]?.allowed) {
      return { error: NextResponse.json({ error: 'Insufficient permissions for this module' }, { status: 403 }) } as const;
    }
    return auth;
  } catch (error) {
    console.error('Database RBAC check failed closed', error);
    return { error: NextResponse.json({ error: 'Authorization service unavailable' }, { status: 503 }) } as const;
  }
}
export function isGlobalStoreRole(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'super_admin' || user.role === 'admin';
}
