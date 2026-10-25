import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireSession } from '@/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const auth=await requireSession(); if('error' in auth)return auth.error;
 const role=auth.user.role;
 const globalScope=['super_admin','admin'].includes(role);
 const scope=[globalScope,auth.user.storeId];
 const salesRoles=['super_admin','admin','manager','cashier','salesman','supervisor','accountant'];
 const canSeeSales=salesRoles.includes(role);
 const canSeeFinance=['super_admin','admin','manager','accountant'].includes(role);
 const canSeeInventory=['super_admin','admin','manager','inventory_manager','store_keeper','supervisor'].includes(role);
 const canSeeCustomers=['super_admin','admin','manager','cashier','salesman'].includes(role);
 const canSeePeople=['super_admin','admin','hr_manager','supervisor','employee'].includes(role);
 const ownSales=['cashier','salesman'].includes(role);
 try{
  const [sales,products,customers,expenses,lowStock,recent,people,tasks]=await Promise.all([
   canSeeSales?db().query(`SELECT COUNT(*)::int transactions,COALESCE(SUM(grand_total),0)::numeric(14,2) revenue,COALESCE(AVG(grand_total),0)::numeric(14,2) average_order FROM sales WHERE status='completed' AND created_at >= date_trunc('month',NOW()) AND ($1::boolean=true OR store_id=$2) AND ($3::boolean=false OR cashier_id=$4)`,[...scope,ownSales,auth.user.id]):Promise.resolve({rows:[{transactions:0,revenue:0,average_order:0}]}),
   canSeeInventory?db().query('SELECT COUNT(*)::int total FROM products WHERE is_active=true'):Promise.resolve({rows:[{total:0}]}),
   canSeeCustomers?db().query('SELECT COUNT(*)::int total FROM customers'):Promise.resolve({rows:[{total:0}]}),
   canSeeFinance?db().query('SELECT COALESCE(SUM(amount),0)::numeric(14,2) total FROM expenses WHERE expense_date >= date_trunc(\'month\',CURRENT_DATE) AND ($1::boolean=true OR store_id=$2)',scope):Promise.resolve({rows:[{total:0}]}),
   canSeeInventory?db().query('SELECT p.id,p.name,p.sku,si.quantity AS stock_qty,p.reorder_level FROM store_inventory si JOIN products p ON p.id=si.product_id WHERE p.is_active=true AND si.quantity<=p.reorder_level AND ($1::boolean=true OR si.store_id=$2) ORDER BY si.quantity ASC LIMIT 8',scope):Promise.resolve({rows:[]}),
   canSeeSales?db().query(`SELECT s.id,s.invoice_no,s.grand_total,s.payment_method,s.created_at,u.full_name cashier FROM sales s LEFT JOIN app_users u ON u.id=s.cashier_id WHERE ($1::boolean=true OR s.store_id=$2) AND ($3::boolean=false OR s.cashier_id=$4) ORDER BY s.created_at DESC LIMIT 8`,[...scope,ownSales,auth.user.id]):Promise.resolve({rows:[]}),
   canSeePeople?db().query('SELECT (SELECT COUNT(*)::int FROM employees e WHERE e.employment_status=\'active\' AND ($1::boolean=true OR e.store_id=$2)) employees,(SELECT COUNT(*)::int FROM leave_requests l JOIN employees e ON e.id=l.employee_id WHERE l.status=\'pending\' AND ($1::boolean=true OR e.store_id=$2)) pending_leave',[globalScope,auth.user.storeId]):Promise.resolve({rows:[{employees:0,pending_leave:0}]}),
   canSeePeople?db().query('SELECT COUNT(*)::int total FROM tasks WHERE ($1::boolean=true OR store_id=$2) AND ($3::boolean=true OR assigned_to=$4)',[globalScope,auth.user.storeId,['super_admin','admin','manager','supervisor','hr_manager'].includes(role),auth.user.id]):Promise.resolve({rows:[{total:0}]})
  ]);
  const summary={transactions:Number(sales.rows[0]?.transactions||0),revenue:Number(sales.rows[0]?.revenue||0),average_order:Number(sales.rows[0]?.average_order||0),products:Number(products.rows[0]?.total||0),customers:Number(customers.rows[0]?.total||0),expenses:Number(expenses.rows[0]?.total||0),employees:Number(people.rows[0]?.employees||0),pendingLeave:Number(people.rows[0]?.pending_leave||0),tasks:Number(tasks.rows[0]?.total||0)};
  return NextResponse.json({summary,lowStock:lowStock.rows,recentSales:recent.rows,capabilities:{sales:canSeeSales,finance:canSeeFinance,inventory:canSeeInventory,customers:canSeeCustomers,people:canSeePeople},role},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Dashboard GET',e);return NextResponse.json({error:'Could not load dashboard data'},{status:500});}
}
