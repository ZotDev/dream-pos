import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireSession } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const invoiceNo = req.nextUrl.searchParams.get('invoice')?.trim();
  try {
    if (invoiceNo) {
      const sale = await db().query(
        `SELECT s.id,s.invoice_no,s.store_id,s.cashier_id,s.customer_id,s.subtotal,s.tax_total,s.discount_total,
                s.grand_total,s.payment_method,s.status,s.created_at,c.name AS customer_name,c.phone AS customer_phone,
                c.email AS customer_email,c.address AS customer_address
         FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
         WHERE s.invoice_no=$1 AND ($2::boolean=true OR s.store_id=$3) LIMIT 1`,
        [invoiceNo,['super_admin','admin'].includes(auth.user.role),auth.user.storeId],
      );
      if (!sale.rows[0]) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      const items = await db().query(
        'SELECT product_id,product_name,sku,quantity,unit_price,tax_rate,line_total FROM sale_items WHERE sale_id=$1 ORDER BY id',
        [sale.rows[0].id],
      );
      return NextResponse.json({ invoice: sale.rows[0], items: items.rows });
    }
    const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 100)));
    const result = await db().query(
      `SELECT s.id,s.invoice_no,s.subtotal,s.tax_total,s.discount_total,s.grand_total,s.payment_method,s.status,s.created_at,
              c.name AS customer_name,c.phone AS customer_phone
       FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
       WHERE ($2::boolean=true OR s.store_id=$3) ORDER BY s.created_at DESC LIMIT $1`,
      [limit,['super_admin','admin'].includes(auth.user.role),auth.user.storeId],
    );
    return NextResponse.json({ invoices: result.rows });
  } catch (error) {
    console.error('Invoice query failed', error);
    return NextResponse.json({ error: 'Could not load invoices' }, { status: 500 });
  }
}
