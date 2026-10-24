import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireRole } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireRole(['super_admin', 'admin', 'manager', 'accountant', 'inventory_manager']);
  if ('error' in auth) return auth.error;
  const from = req.nextUrl.searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const to = req.nextUrl.searchParams.get('to') || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    return NextResponse.json({ error: 'Valid date range required' }, { status: 400 });
  }
  try {
    const [totals, daily, suppliers, topProducts] = await Promise.all([
      db().query(
        `SELECT COUNT(*)::int AS orders, COALESCE(SUM(subtotal),0)::numeric(14,2) AS subtotal,
                COALESCE(SUM(tax_total),0)::numeric(14,2) AS tax,
                COALESCE(SUM(grand_total),0)::numeric(14,2) AS spend
         FROM purchases WHERE status <> 'cancelled' AND created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day') AND ($3::boolean=true OR store_id=$4)`,
        [from, to, ['super_admin','admin'].includes(auth.user.role), auth.user.storeId],
      ),
      db().query(
        `SELECT created_at::date AS date, COUNT(*)::int AS orders, COALESCE(SUM(grand_total),0)::numeric(14,2) AS spend
         FROM purchases WHERE status <> 'cancelled' AND created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
         GROUP BY created_at::date ORDER BY date`,
        [from, to],
      ),
      db().query(
        `SELECT COALESCE(s.name,'Unassigned') AS supplier, COUNT(*)::int AS orders,
                COALESCE(SUM(p.grand_total),0)::numeric(14,2) AS spend
         FROM purchases p LEFT JOIN suppliers s ON s.id=p.supplier_id
         WHERE p.status <> 'cancelled' AND p.created_at >= $1::date AND p.created_at < ($2::date + INTERVAL '1 day') AND ($3::boolean=true OR p.store_id=$4)
         GROUP BY s.name ORDER BY spend DESC LIMIT 10`,
        [from, to, ['super_admin','admin'].includes(auth.user.role), auth.user.storeId],
      ),
      db().query(
        `SELECT pr.name AS product, SUM(pi.quantity)::numeric(14,3) AS quantity,
                SUM(pi.line_total)::numeric(14,2) AS spend
         FROM purchase_items pi JOIN purchases p ON p.id=pi.purchase_id JOIN products pr ON pr.id=pi.product_id
         WHERE p.status <> 'cancelled' AND p.created_at >= $1::date AND p.created_at < ($2::date + INTERVAL '1 day') AND ($3::boolean=true OR p.store_id=$4)
         GROUP BY pr.name ORDER BY spend DESC LIMIT 10`,
        [from, to, ['super_admin','admin'].includes(auth.user.role), auth.user.storeId],
      ),
    ]);
    return NextResponse.json({ from, to, totals: totals.rows[0], daily: daily.rows, suppliers: suppliers.rows, topProducts: topProducts.rows });
  } catch (error) {
    console.error('Purchase report failed', error);
    return NextResponse.json({ error: 'Could not generate purchase report' }, { status: 500 });
  }
}
