import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireRole } from '@/lib/server/auth';

export const runtime = 'nodejs';
const canCheckout = ['super_admin', 'admin', 'manager', 'cashier', 'salesman', 'supervisor'];

export async function GET(req: NextRequest) {
  const auth = await requireRole(['super_admin','admin','manager','cashier','salesman','supervisor','accountant']);
  if ('error' in auth) return auth.error;
  const from=req.nextUrl.searchParams.get('from')||'2000-01-01';
  const to=req.nextUrl.searchParams.get('to')||'2999-12-31';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)return NextResponse.json({error:'Valid date range required'},{status:400});
  try {
    const r=await db().query(`SELECT s.id,s.invoice_no,s.store_id,s.cashier_id,s.customer_id,s.subtotal,s.tax_total,s.discount_total,s.grand_total,s.payment_method,s.status,s.created_at,c.name AS customer_name,u.full_name AS cashier_name FROM sales s LEFT JOIN customers c ON c.id=s.customer_id LEFT JOIN app_users u ON u.id=s.cashier_id WHERE s.created_at >= $1::date AND s.created_at < ($2::date + INTERVAL '1 day') AND ($3::bigint IS NULL OR s.store_id=$3) ORDER BY s.created_at DESC LIMIT 1000`,[from,to,['super_admin','admin'].includes(auth.user.role)?null:auth.user.storeId]);
    return NextResponse.json({sales:r.rows,from,to});
  } catch(e) { console.error(e); return NextResponse.json({error:'Could not load sales history'},{status:500}); }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(canCheckout);
  if ('error' in auth) return auth.error;

  const storeId=auth.user.storeId;
  if(!storeId)return NextResponse.json({error:'Assign an active store to this account before checkout'},{status:400});
  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  const payment = String(body?.paymentMethod ?? 'cash');
  const requestKey = String(body?.idempotencyKey ?? randomUUID()).trim();
  const customerId = body?.customerId == null || body.customerId === '' ? null : Number(body.customerId);

  if (!items.length || items.length > 100 || !['cash', 'card', 'upi', 'other'].includes(payment)) {
    return NextResponse.json({ error: 'Valid cart and payment method are required' }, { status: 400 });
  }
  if (!requestKey || requestKey.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(requestKey)) {
    return NextResponse.json({ error: 'A valid idempotency key is required' }, { status: 400 });
  }
  if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
    return NextResponse.json({ error: 'A valid customer is required' }, { status: 400 });
  }

  // A stable invoice number backed by the existing UNIQUE constraint makes retries safe.
  const invoice = `INV-${auth.user.id}-${requestKey}`;
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [invoice]);

    const existing = await client.query(
      'SELECT id, invoice_no, customer_id, subtotal, tax_total, grand_total, payment_method, created_at FROM sales WHERE invoice_no = $1',
      [invoice],
    );
    if (existing.rows[0]) {
      await client.query('COMMIT');
      const sale = existing.rows[0];
      return NextResponse.json({
        sale, subtotal: Number(sale.subtotal), taxTotal: Number(sale.tax_total),
        total: Number(sale.grand_total), duplicate: true,
      }, { status: 200 });
    }

    if (customerId !== null) {
      const customer = await client.query('SELECT id FROM customers WHERE id = $1', [customerId]);
      if (!customer.rows[0]) throw new Error('Selected customer was not found');
    }

    let subtotal = 0;
    const lines: Array<{ p: any; qty: number; unit: number; taxRate: number; line: number }> = [];
    const combined = new Map<number,number>();
    for (const item of items) { const id=Number(item.productId),qty=Number(item.quantity); if(!Number.isInteger(id)||id<=0||!Number.isFinite(qty)||qty<=0||qty>10000)throw new Error('Invalid item quantity'); const total=(combined.get(id)||0)+qty; if(total>10000)throw new Error('Combined product quantity exceeds the checkout limit'); combined.set(id,total); }
    for (const [id,qty] of combined) {
      await client.query('INSERT INTO store_inventory(store_id,product_id,quantity) VALUES($1,$2,0) ON CONFLICT(store_id,product_id) DO NOTHING',[storeId,id]);
      const pr = await client.query(
        'SELECT p.id,p.name,p.sku,p.selling_price,si.quantity AS stock_qty,p.tax_rate FROM products p JOIN store_inventory si ON si.product_id=p.id AND si.store_id=$2 WHERE p.id=$1 AND p.is_active=true FOR UPDATE OF p,si',
        [id,storeId],
      );
      const p = pr.rows[0];
      if (!p) throw new Error('Product not found');
      if (Number(p.stock_qty) < qty) throw new Error(`Insufficient stock for ${p.name}`);
      const unit = Number(p.selling_price);
      const taxRate = Number(p.tax_rate);
      const line = unit * qty;
      subtotal += line;
      lines.push({ p, qty, unit, taxRate, line });
    }

    const taxTotal = lines.reduce((sum, item) => sum + item.line * item.taxRate / 100, 0);
    const total = subtotal + taxTotal;
    const inserted = await client.query(
      `INSERT INTO sales(invoice_no,store_id,cashier_id,customer_id,subtotal,tax_total,discount_total,grand_total,payment_method)
       VALUES($1,$2,$3,$4,$5,$6,0,$7,$8)
       RETURNING id,invoice_no,customer_id,subtotal,tax_total,grand_total,payment_method,created_at`,
      [invoice, storeId, auth.user.id, customerId, subtotal, taxTotal, total, payment],
    );
    for (const item of lines) {
      await client.query(
        'INSERT INTO sale_items(sale_id,product_id,product_name,sku,quantity,unit_price,tax_rate,line_total) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [inserted.rows[0].id, item.p.id, item.p.name, item.p.sku, item.qty, item.unit, item.taxRate, item.line],
      );
      await client.query('UPDATE store_inventory SET quantity=quantity-$1,updated_at=NOW() WHERE store_id=$2 AND product_id=$3',[item.qty,storeId,item.p.id]);
      await client.query('UPDATE products SET stock_qty=(SELECT COALESCE(SUM(quantity),0) FROM store_inventory WHERE product_id=$1),updated_at=NOW() WHERE id=$1',[item.p.id]);
      await client.query(
        "INSERT INTO stock_movements(product_id,user_id,store_id,movement_type,quantity,reference) VALUES($1,$2,$3,'sale',$4,$5)",
        [item.p.id, auth.user.id, storeId, -item.qty, invoice],
      );
    }
    await client.query('COMMIT');
    return NextResponse.json({ sale: inserted.rows[0], subtotal, taxTotal, total, duplicate: false }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Sales checkout failed', error);
    return NextResponse.json({ error: error?.message || 'Checkout failed' }, { status: 400 });
  } finally {
    client.release();
  }
}
