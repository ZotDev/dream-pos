import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
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
  'Stores':'stores','Audit Log':'audit','SaaS Super Admin':'saas',
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
  const auth = await requireRole(Object.keys(SERVER_ROLE_MODULE_ACCESS));
  if ('error' in auth) return auth;
  if (!roleCanAccessModule(auth.user.role, module)) {
    return { error: NextResponse.json({ error: 'Insufficient permissions for this module' }, { status: 403 }) } as const;
  }
  return auth;
}
export function isGlobalStoreRole(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'super_admin' || user.role === 'admin';
}
