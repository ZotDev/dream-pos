import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireSession } from '@/lib/server/auth';
export const runtime='nodejs';
export async function GET(){
 const auth=await requireSession(); if('error' in auth)return auth.error;
 try{
  const [sales,products,customers,expenses,lowStock,recent]=await Promise.all([
   db().query(`SELECT COUNT(*)::int transactions,COALESCE(SUM(grand_total),0)::numeric(14,2) revenue,COALESCE(AVG(grand_total),0)::numeric(14,2) average_order FROM sales WHERE status='completed' AND created_at >= date_trunc('month',NOW())`),
   db().query(`SELECT COUNT(*)::int total FROM products WHERE is_active=true`),
   db().query(`SELECT COUNT(*)::int total FROM customers`),
   db().query(`SELECT COALESCE(SUM(amount),0)::numeric(14,2) total FROM expenses WHERE expense_date >= date_trunc('month',CURRENT_DATE)`),
   db().query(`SELECT id,name,sku,stock_qty,reorder_level FROM products WHERE is_active=true AND stock_qty<=reorder_level ORDER BY stock_qty ASC LIMIT 8`),
   db().query(`SELECT s.id,s.invoice_no,s.grand_total,s.payment_method,s.created_at,u.full_name cashier FROM sales s LEFT JOIN app_users u ON u.id=s.cashier_id ORDER BY s.created_at DESC LIMIT 8`)
  ]);
  return NextResponse.json({summary:{...sales.rows[0],products:products.rows[0].total,customers:customers.rows[0].total,expenses:expenses.rows[0].total},lowStock:lowStock.rows,recentSales:recent.rows});
 }catch(e){console.error('Dashboard GET',e);return NextResponse.json({error:'Could not load dashboard data'},{status:500});}
}
