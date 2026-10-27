import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireRole } from '@/lib/server/auth';
import { requireModule } from '@/lib/server/permissions';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireModule('Invoices'); if ('error' in auth) return auth.error;
  const invoiceNo = req.nextUrl.searchParams.get('invoice')?.trim();
  try {
    if (invoiceNo) {
      const sale = await db().query(
        `SELECT s.id,s.invoice_no,s.store_id,s.cashier_id,s.customer_id,s.subtotal,s.tax_total,s.discount_total,
                s.grand_total,s.payment_method,s.status,s.created_at,s.place_of_supply_state_code,s.reverse_charge,
                s.document_type,s.original_invoice_no,s.notes,c.name AS customer_name,c.phone AS customer_phone,
                c.email AS customer_email,c.address AS customer_address,c.gstin AS customer_gstin,c.state_code AS customer_state_code,
                st.name AS store_name,st.legal_name AS supplier_legal_name,st.gstin AS supplier_gstin,st.pan AS supplier_pan,
                st.address AS supplier_address,st.phone AS supplier_phone,st.email AS supplier_email,
                st.state_name AS supplier_state_name,st.state_code AS supplier_state_code
         FROM sales s LEFT JOIN customers c ON c.id=s.customer_id LEFT JOIN stores st ON st.id=s.store_id
         WHERE s.invoice_no=$1 AND ($2::boolean=true OR s.store_id=$3) LIMIT 1`,
        [invoiceNo,['super_admin','admin'].includes(auth.user.role),auth.user.storeId],
      );
      if (!sale.rows[0]) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      const items = await db().query(
        'SELECT si.product_id,si.product_name,si.sku,si.quantity,si.unit_price,si.tax_rate,si.line_total,p.hsn_sac_code,p.unit FROM sale_items si LEFT JOIN products p ON p.id=si.product_id WHERE si.sale_id=$1 ORDER BY si.id',
        [sale.rows[0].id],
      );
      const invoice = sale.rows[0];
      const sameState = Boolean(invoice.supplier_state_code && invoice.place_of_supply_state_code && invoice.supplier_state_code === invoice.place_of_supply_state_code);
      const lines = items.rows.map((item:any) => {
        const taxable = Number(item.line_total || 0);
        const rate = Number(item.tax_rate || 0);
        const tax = taxable * rate / 100;
        return { ...item, quantity:Number(item.quantity), unit_price:Number(item.unit_price), line_total:taxable, tax_amount:Number(tax.toFixed(2)), cgst_amount:sameState?Number((tax/2).toFixed(2)):0, sgst_amount:sameState?Number((tax/2).toFixed(2)):0, igst_amount:invoice.supplier_state_code && invoice.place_of_supply_state_code && !sameState?Number(tax.toFixed(2)):0, hsn_missing:!item.hsn_sac_code };
      });
      const complianceWarnings:string[] = [];
      if (!invoice.supplier_legal_name) complianceWarnings.push('Configure the supplier legal name in store settings.');
      if (!invoice.supplier_gstin) complianceWarnings.push('Supplier GSTIN is not configured; confirm whether the supplier is registered and whether GST applies.');
      if (lines.some((x:any)=>x.hsn_missing)) complianceWarnings.push('One or more items have no HSN/SAC code.');
      if (!invoice.place_of_supply_state_code) complianceWarnings.push('Place of supply is missing; tax type (CGST/SGST vs IGST) cannot be confirmed.');
      if (!invoice.customer_gstin) complianceWarnings.push('Customer GSTIN is absent; verify recipient classification and invoice particulars.');
      return NextResponse.json({ invoice, items:lines, taxBreakup:{ cgst:lines.reduce((s:number,x:any)=>s+x.cgst_amount,0), sgst:lines.reduce((s:number,x:any)=>s+x.sgst_amount,0), igst:lines.reduce((s:number,x:any)=>s+x.igst_amount,0) }, complianceWarnings, legalNotice:'Invoice data is a draft output. Verify supplier/recipient particulars, applicable HSN/SAC, tax rates, place of supply, numbering, and e-invoicing/e-way bill requirements before issuing as a statutory document.' });
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
