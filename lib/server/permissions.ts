import { requireRole } from '@/lib/server/auth';
import type { SessionUser } from '@/lib/server/auth';
import { NextResponse } from 'next/server';

/**
 * Canonical server-side module access matrix. Keep module names aligned with
 * lib/permissions.ts; this matrix is the enforcement source for API handlers.
 */
export const SERVER_ROLE_MODULE_ACCESS: Record<string, readonly string[]> = {
  super_admin: ['*'],
  admin: ['Overview','Categories','POS Billing','Sales History','Returns & Exchanges','Quotations','Deliveries','Products','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers','Purchases','Suppliers','Customers','Invoices','Expenses & Finance','Accounting','Reports & Analytics','Attendance','Leave Management','Employees','Tasks','HRM & Payroll','Users & Roles','Stores','Audit Log'],
  manager: ['Overview','Categories','POS Billing','Sales History','Returns & Exchanges','Quotations','Deliveries','Products','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers','Purchases','Suppliers','Customers','Invoices','Expenses & Finance','Reports & Analytics','Attendance','Leave Management','Tasks'],
  cashier: ['Overview','POS Billing','Sales History','Returns & Exchanges','Customers','Invoices'],
  inventory_manager: ['Overview','Products','Categories','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers','Purchases','Suppliers','Reports & Analytics'],
  store_keeper: ['Overview','Products','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers'],
  salesman: ['Overview','POS Billing','Sales History','Quotations','Deliveries','Customers','Invoices'],
  supervisor: ['Overview','POS Billing','Inventory','Warehouse','Warehouse Transfers','Attendance','Leave Management','Tasks','Deliveries'],
  delivery_biker: ['Overview','Deliveries','Tasks'],
  employee: ['Overview','Attendance','Leave Management','Tasks'],
  accountant: ['Overview','Purchases','Invoices','Expenses & Finance','Accounting','Reports & Analytics','HRM & Payroll'],
  hr_manager: ['Overview','Attendance','Leave Management','Employees','HRM & Payroll','Tasks'],
};

export const ROLE_MODULE_KEYS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['overview','categories','pos','sales','returns','quotations','deliveries','products','inventory','warehouse','warehouse_stock','warehouse_transfers','purchases','suppliers','customers','invoices','expenses','accounting','reports','attendance','leave','employees','tasks','payroll','users','stores','audit'],
  manager: ['overview','categories','pos','sales','returns','quotations','deliveries','products','inventory','warehouse','warehouse_stock','warehouse_transfers','purchases','suppliers','customers','invoices','expenses','reports','attendance','leave','tasks'],
  cashier: ['overview','pos','sales','returns','customers','invoices'],
  inventory_manager: ['overview','products','categories','inventory','warehouse','warehouse_stock','warehouse_transfers','purchases','suppliers','reports'],
  store_keeper: ['overview','products','inventory','warehouse','warehouse_stock','warehouse_transfers'],
  salesman: ['overview','pos','sales','quotations','deliveries','customers','invoices'],
  supervisor: ['overview','pos','inventory','warehouse','warehouse_transfers','attendance','leave','tasks','deliveries'],
  delivery_biker: ['overview','deliveries','tasks'],
  employee: ['overview','attendance','leave','tasks'],
  accountant: ['overview','purchases','invoices','expenses','accounting','reports','payroll'],
  hr_manager: ['overview','attendance','leave','employees','payroll','tasks'],
};

export function roleCanAccessModule(role: string, module: string): boolean {
  const allowed = SERVER_ROLE_MODULE_ACCESS[role];
  return Boolean(allowed && (allowed.includes('*') || allowed.includes(module)));
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
