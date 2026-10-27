import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireModule } from '@/lib/server/permissions';

export const runtime = 'nodejs';

// Management report only: validate registrations, HSN and place-of-supply before using
// any export for statutory filing. This endpoint does not file GSTR-1/3B.
export async function GET(req: NextRequest) {
  const auth = await requireModule('Reports & Analytics');
  if ('error' in auth) return auth.error;
  const from = req.nextUrl.searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const to = req.nextUrl.searchParams.get('to') || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return NextResponse.json({ error: 'Valid date range required' }, { status: 400 });
  const global = ['super_admin', 'admin'].includes(auth.user.role);
  try {
    const [profile, summary, rates, hsn, invoices] = await Promise.all([
      db().query('SELECT id,name,legal_name,gstin,pan,state_name,state_code,address,phone,email FROM stores WHERE id=$1', [auth.user.storeId]),
      db().query(`SELECT COUNT(*)::int AS document_count, COUNT(*) FILTER (WHERE c.gstin IS NOT NULL AND BTRIM(c.gstin)<>'')::int AS b2b_documents, COUNT(*) FILTER (WHERE c.id IS NULL OR c.gstin IS NULL OR BTRIM(c.gstin)='')::int AS b2c_or_unregistered_documents, COALESCE(SUM(s.subtotal),0)::numeric(14,2) AS taxable_value, COALESCE(SUM(s.tax_total),0)::numeric(14,2) AS tax_collected, COALESCE(SUM(s.grand_total),0)::numeric(14,2) AS invoice_value FROM sales s LEFT JOIN customers c ON c.id=s.customer_id WHERE s.status='completed' AND s.created_at >= $1::date AND s.created_at < ($2::date + INTERVAL '1 day') AND ($3::boolean=true OR s.store_id=$4)`, [from,to,global,auth.user.storeId]),
      db().query(`SELECT si.tax_rate, COUNT(DISTINCT s.id)::int AS invoices, SUM(si.quantity*si.unit_price)::numeric(14,2) AS taxable_value, SUM(si.line_total*si.tax_rate/100)::numeric(14,2) AS indicative_tax FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.status='completed' AND s.created_at >= $1::date AND s.created_at < ($2::date + INTERVAL '1 day') AND ($3::boolean=true OR s.store_id=$4) GROUP BY si.tax_rate ORDER BY si.tax_rate`, [from,to,global,auth.user.storeId]),
      db().query(`SELECT COALESCE(p.hsn_sac_code,'MISSING') AS hsn_sac_code, si.tax_rate, SUM(si.quantity)::numeric(14,3) AS quantity, SUM(si.line_total)::numeric(14,2) AS taxable_value, SUM(si.line_total*si.tax_rate/100)::numeric(14,2) AS indicative_tax, COUNT(*) FILTER (WHERE p.hsn_sac_code IS NULL OR BTRIM(p.hsn_sac_code)='')::int AS rows_missing_hsn FROM sale_items si JOIN sales s ON s.id=si.sale_id LEFT JOIN products p ON p.id=si.product_id WHERE s.status='completed' AND s.created_at >= $1::date AND s.created_at < ($2::date + INTERVAL '1 day') AND ($3::boolean=true OR s.store_id=$4) GROUP BY COALESCE(p.hsn_sac_code,'MISSING'),si.tax_rate ORDER BY hsn_sac_code,si.tax_rate`, [from,to,global,auth.user.storeId]),
      db().query(`SELECT s.invoice_no,s.created_at::date AS invoice_date,c.name AS customer_name,c.gstin AS customer_gstin,s.subtotal,s.tax_total,s.grand_total,s.place_of_supply_state_code,s.reverse_charge,s.document_type,COUNT(si.id)::int AS line_count,COUNT(*) FILTER (WHERE p.hsn_sac_code IS NULL OR BTRIM(p.hsn_sac_code)='')::int AS lines_missing_hsn FROM sales s LEFT JOIN customers c ON c.id=s.customer_id LEFT JOIN sale_items si ON si.sale_id=s.id LEFT JOIN products p ON p.id=si.product_id WHERE s.status='completed' AND s.created_at >= $1::date AND s.created_at < ($2::date + INTERVAL '1 day') AND ($3::boolean=true OR s.store_id=$4) GROUP BY s.id,c.name,c.gstin ORDER BY s.created_at DESC LIMIT 1000`, [from,to,global,auth.user.storeId])
    ]);
    const store = profile.rows[0] || null;
    const missing = [];
    if (!store?.legal_name) missing.push('Legal supplier name');
    if (!store?.gstin) missing.push('Supplier GSTIN (if GST-registered)');
    if (!store?.state_code) missing.push('Supplier state code');
    if (invoices.rows.some((x:any) => Number(x.lines_missing_hsn)>0)) missing.push('HSN/SAC code on one or more invoice lines');
    if (invoices.rows.some((x:any) => !x.place_of_supply_state_code)) missing.push('Place of supply on one or more invoices');
    return NextResponse.json({ from,to,store,summary:summary.rows[0],rateSummary:rates.rows,hsnSummary:hsn.rows,invoices:invoices.rows,complianceWarnings:missing,notice:'Management reconciliation only; not a filed GST return or a certification of statutory compliance. Confirm applicable GST rules, HSN/rates, invoice thresholds and e-invoicing/e-way bill applicability with a qualified Indian tax professional.' });
  } catch (e) {
    console.error('GST report failed', e);
    return NextResponse.json({ error: 'Could not generate GST report. Apply the Indian tax metadata migration first.' }, { status: 500 });
  }
}
