import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireRole, requireSession } from '@/lib/server/auth';
export const runtime='nodejs';
const canWrite=['super_admin','admin','manager','inventory_manager','store_keeper'];
export async function GET() {
 const auth=await requireSession(); if('error' in auth) return auth.error;
 try { const r=await db().query(`SELECT p.id,p.name,p.sku,COALESCE(p.barcode,'') barcode,COALESCE(c.name,'General') category,p.selling_price price,p.stock_qty stock,p.reorder_level FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.is_active=true ORDER BY p.name`); return NextResponse.json({products:r.rows.map(p=>({...p,id:String(p.id),price:Number(p.price),stock:Number(p.stock),status:Number(p.stock)<=0?'Out of stock':Number(p.stock)<=Number(p.reorder_level)?'Low stock':'In stock'}))}); }
 catch(e){console.error('Products GET',e);return NextResponse.json({error:'Could not load products'},{status:500});}
}
export async function POST(req:NextRequest) {
 const auth=await requireRole(canWrite); if('error' in auth) return auth.error;
 try { const b=await req.json(); const name=String(b.name??'').trim(), sku=String(b.sku??'').trim(), barcode=String(b.barcode??'').trim()||null, category=String(b.category??'General').trim(), price=Number(b.price), stock=Number(b.stock??0), reorder=Number(b.reorderLevel??10);
  if(!name||!sku||!Number.isFinite(price)||price<0||!Number.isFinite(stock)||stock<0||!Number.isFinite(reorder)||reorder<0) return NextResponse.json({error:'Valid name, SKU, price and stock are required'},{status:400});
  const r=await db().query(`WITH cat AS (INSERT INTO categories(name) VALUES($4) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id) INSERT INTO products(sku,barcode,name,category_id,selling_price,stock_qty,reorder_level) SELECT $2,$3,$1,id,$5,$6,$7 FROM cat RETURNING id,name,sku,barcode,selling_price,stock_qty,reorder_level`,[name,sku,barcode,category,price,stock,reorder]); const p=r.rows[0]; return NextResponse.json({product:{...p,id:String(p.id),price:Number(p.selling_price),stock:Number(p.stock_qty),category,status:Number(p.stock_qty)<=0?'Out of stock':Number(p.stock_qty)<=Number(p.reorder_level)?'Low stock':'In stock'}},{status:201});
 } catch(e:any){ if(e?.code==='23505') return NextResponse.json({error:'SKU or barcode already exists'},{status:409}); console.error('Products POST',e);return NextResponse.json({error:'Could not save product'},{status:500}); }
}
