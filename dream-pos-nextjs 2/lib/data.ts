export type Product = { id: string; name: string; sku: string; barcode: string; category: string; price: number; stock: number; status: 'In stock'|'Low stock'|'Out of stock' };
export const initialProducts: Product[] = [
 {id:'PRD-1001',name:'Everyday Cotton T-Shirt',sku:'TSH-001',barcode:'890100100001',category:'Apparel',price:499,stock:42,status:'In stock'},
 {id:'PRD-1002',name:'Classic Denim Jeans',sku:'JNS-002',barcode:'890100100002',category:'Apparel',price:1299,stock:8,status:'Low stock'},
 {id:'PRD-1003',name:'Insulated Water Bottle',sku:'BOT-003',barcode:'890100100003',category:'Accessories',price:349,stock:0,status:'Out of stock'},
 {id:'PRD-1004',name:'Canvas Tote Bag',sku:'BAG-004',barcode:'890100100004',category:'Accessories',price:299,stock:19,status:'In stock'},
 {id:'PRD-1005',name:'Wireless Earbuds',sku:'ELC-005',barcode:'890100100005',category:'Electronics',price:2199,stock:12,status:'In stock'},
];
export const roles = ['Super Admin','Admin','Manager','Cashier','Inventory Manager','Store Keeper','Salesman','Supervisor','Delivery Biker','Employee','Accountant','HR Manager'];
export const modules = [
 {title:'Point of Sale',desc:'Cashier billing, checkout, returns and exchanges',icon:'ShoppingCart',items:['New Sale','Sales History','Returns & Exchanges','Barcode Lookup']},
 {title:'Products & Categories',desc:'Catalog, product images, variants and barcodes',icon:'Package',items:['Products','Categories','Barcode Management','Price Lists']},
 {title:'Inventory & Stock',desc:'Stock movement, transfers, adjustments and alerts',icon:'Boxes',items:['Stock Overview','Stock Adjustments','Stock Transfers','Low Stock']},
 {title:'Warehouse Management',desc:'Warehouses, bins and inter-store transfers',icon:'Warehouse',items:['Warehouses','Locations','Transfers']},
 {title:'Purchases & Suppliers',desc:'Purchase orders, goods received and suppliers',icon:'Truck',items:['Purchase Orders','Goods Received','Suppliers','Supplier Payments']},
 {title:'Sales & Customers',desc:'Sales orders, customer profiles and loyalty',icon:'Users',items:['Sales Orders','Customers','Loyalty Programme','Quotations']},
 {title:'Invoices & Documents',desc:'Create, review, edit, print and share documents',icon:'FileText',items:['Invoices','Estimates','Credit Notes','Document Templates']},
 {title:'Expenses & Finance',desc:'Expenses, accounting, taxes and reconciliation',icon:'Wallet',items:['Expenses','Accounts','Tax Settings','Profit & Loss']},
 {title:'Reports & Analytics',desc:'Sales, purchases, inventory, tax and store performance',icon:'ChartNoAxesCombined',items:['Sales Reports','Purchase Reports','Inventory Reports','Tax Reports','Revenue Analytics']},
 {title:'HRM & Payroll',desc:'Employees, attendance, leave and payroll',icon:'BriefcaseBusiness',items:['Employees','Attendance','Leave','Payroll']},
 {title:'Users & Permissions',desc:'Role-based access and audit history',icon:'ShieldCheck',items:['Users','Roles','Permissions','Audit Log']},
 {title:'SaaS Super Admin',desc:'Tenants, subscriptions, plans and platform settings',icon:'CloudCog',items:['Tenants','Subscriptions','Plans','Platform Settings']},
];
export const formatINR = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
