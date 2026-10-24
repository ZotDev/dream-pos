import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireRole } from '@/lib/server/auth';
export const runtime='nodejs';
const canCheckout=['super_admin','admin','manager','cashier','salesman','supervisor'];
export async function POST(req:NextRequest){
 const auth=await requireRole(canCheckout);if('error' in auth)return auth.error;
 const b=await req.json().catch(()=>null);const items=Array.isArray(b?.items)?b.items:[];const payment=String(b?.paymentMethod??'cash');if(!items.length||items.length>100||!['cash','card','upi','other'].includes(payment))return NextResponse.json({error:'Valid cart and payment method are required'},{status:400});
 const client=await db().connect();try{await client.query('BEGIN');let subtotal=0;const lines=[];
 for(const item of items){const id=Number(item.productId),qty=Number(item.quantity);if(!Number.isInteger(id)||id<=0||!Number.isFinite(qty)||qty<=0||qty>10000)throw new Error('Invalid item quantity');const pr=await client.query('SELECT id,name,sku,selling_price,stock_qty,tax_rate FROM products WHERE id=$1 AND is_active=true FOR UPDATE',[id]);const p=pr.rows[0];if(!p)throw new Error('Product not found');if(Number(p.stock_qty)<qty)throw new Error(`Insufficient stock for ${p.name}`);const unit=Number(p.selling_price),taxRate=Number(p.tax_rate);const line=unit*qty;subtotal+=line;lines.push({p,qty,unit,taxRate,line});}
 const invoice='INV-'+Date.now()+'-'+Math.floor(Math.random()*900+100);const taxTotal=lines.reduce((s,x)=>s+x.line*x.taxRate/100,0);const total=subtotal+taxTotal;
 const sale=await client.query(`INSERT INTO sales(invoice_no,store_id,cashier_id,subtotal,tax_total,discount_total,grand_total,payment_method) VALUES($1,$2,$3,$4,$5,0,$6,$7) RETURNING id,invoice_no,grand_total,created_at`,[invoice,auth.user.storeId,auth.user.id,subtotal,taxTotal,total,payment]);
 for(const x of lines){await client.query('INSERT INTO sale_items(sale_id,product_id,product_name,sku,quantity,unit_price,tax_rate,line_total) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[sale.rows[0].id,x.p.id,x.p.name,x.p.sku,x.qty,x.unit,x.taxRate,x.line]);await client.query('UPDATE products SET stock_qty=stock_qty-$1,updated_at=NOW() WHERE id=$2',[x.qty,x.p.id]);await client.query("INSERT INTO stock_movements(product_id,user_id,movement_type,quantity,reference) VALUES($1,$2,'sale',$3,$4)",[x.p.id,auth.user.id,-x.qty,invoice]);}
 await client.query('COMMIT');return NextResponse.json({sale:sale.rows[0],subtotal,taxTotal,total},{status:201});
 }catch(e:any){await client.query('ROLLBACK');return NextResponse.json({error:e?.message||'Checkout failed'},{status:400});}finally{client.release();}
}
