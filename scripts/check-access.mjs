import { readFileSync } from 'node:fs';

const matrix = readFileSync('lib/permissions.ts', 'utf8');
const serverPermissions = readFileSync('lib/server/permissions.ts', 'utf8');
const requiredRoles = [
  'Super Admin','Admin','Manager','Cashier','Inventory Manager','Store Keeper',
  'Salesman','Supervisor','Delivery Biker','Employee','Accountant','HR Manager',
];
const missingRoles = requiredRoles.filter(role => !matrix.includes(`'${role}'`) && !matrix.includes(` ${role}:`));
if (missingRoles.length) {
  console.error('Permission matrix is missing roles:', missingRoles.join(', '));
  process.exitCode = 1;
}

const protectedRoutes = [
  ['app/api/products/route.ts', 'Products'],
  ['app/api/sales/route.ts', 'POS Billing'],
  ['app/api/customers/route.ts', 'Customers'],
  ['app/api/suppliers/route.ts', 'Suppliers'],
  ['app/api/expenses/route.ts', 'Expenses & Finance'],
  ['app/api/returns/route.ts', 'Returns & Exchanges'],
  ['app/api/purchases/route.ts', 'Purchases'],
  ['app/api/quotations/route.ts', 'Quotations'],
  ['app/api/deliveries/route.ts', 'Deliveries'],
  ['app/api/warehouse-transfers/route.ts', 'Warehouse Transfers'],
  ['app/api/warehouse-stock/route.ts', 'Warehouse Stock'],
  ['app/api/warehouses/route.ts', 'Warehouse'],
  ['app/api/stock-movements/route.ts', 'Inventory'],
  ['app/api/attendance/route.ts', 'Attendance'],
  ['app/api/leave/route.ts', 'Leave Management'],
  ['app/api/tasks/route.ts', 'Tasks'],
  ['app/api/payroll/route.ts', 'HRM & Payroll'],
  ['app/api/accounting/route.ts', 'Accounting'],
  ['app/api/stores/route.ts', 'Stores'],
  ['app/api/audit/route.ts', 'Audit Log'],
];
const missingRoutes = [];
for (const [path, module] of protectedRoutes) {
  let source = '';
  try { source = readFileSync(path, 'utf8'); } catch {}
  if (!source.includes('requireModule') || !source.includes(`'${module}'`)) missingRoutes.push(path);
}
if (missingRoutes.length) {
  console.error('Routes missing shared permission enforcement (review exceptions):', missingRoutes.join(', '));
  process.exitCode = 1;
}

for (const role of ['super_admin','admin','manager','cashier','inventory_manager','store_keeper','salesman','supervisor','delivery_biker','employee','accountant','hr_manager']) {
  if (!serverPermissions.includes(`${role}:`) && !serverPermissions.includes(`'${role}'`)) {
    console.error('Server role adapter missing role:', role);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log('Access-control static checks passed. This is a source consistency check, not a runtime authorization test.');
