export const ROLE_MODULE_ACCESS: Record<string, string[]> = {
  'Super Admin': ['*'],
  Admin: ['Overview','Categories','POS Billing','Sales History','Returns & Exchanges','Quotations','Deliveries','Products','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers','Purchases','Suppliers','Customers','Invoices','Expenses & Finance','Accounting','Reports & Analytics','Attendance','Leave Management','Employees','Tasks','HRM & Payroll','Users & Roles','Stores','Audit Log'],
  Manager: ['Overview','Categories','POS Billing','Sales History','Returns & Exchanges','Quotations','Deliveries','Products','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers','Purchases','Suppliers','Customers','Invoices','Expenses & Finance','Reports & Analytics','Attendance','Leave Management','Tasks'],
  Cashier: ['Overview','POS Billing','Sales History','Returns & Exchanges','Customers','Invoices'],
  'Inventory Manager': ['Overview','Products','Categories','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers','Purchases','Suppliers','Reports & Analytics'],
  'Store Keeper': ['Overview','Products','Inventory','Warehouse','Warehouse Stock','Warehouse Transfers'],
  Salesman: ['Overview','POS Billing','Sales History','Quotations','Deliveries','Customers','Invoices'],
  Supervisor: ['Overview','POS Billing','Inventory','Warehouse','Warehouse Transfers','Attendance','Leave Management','Tasks','Deliveries'],
  'Delivery Biker': ['Overview','Deliveries','Tasks'],
  Employee: ['Overview','Attendance','Leave Management','Tasks'],
  Accountant: ['Overview','Purchases','Invoices','Expenses & Finance','Accounting','Reports & Analytics','HRM & Payroll'],
  'HR Manager': ['Overview','Attendance','Leave Management','Employees','HRM & Payroll','Tasks'],
};
export function canAccessModule(role: string, module: string): boolean {
  const allowed = ROLE_MODULE_ACCESS[role];
  return Boolean(allowed && (allowed.includes('*') || allowed.includes(module)));
};
export const ROLE_LABELS: Record<string,string> = { super_admin:'Super Admin', admin:'Admin', manager:'Manager', cashier:'Cashier', inventory_manager:'Inventory Manager', store_keeper:'Store Keeper', salesman:'Salesman', supervisor:'Supervisor', delivery_biker:'Delivery Biker', employee:'Employee', accountant:'Accountant', hr_manager:'HR Manager' };
export const ROLE_KEYS = Object.keys(ROLE_LABELS);
