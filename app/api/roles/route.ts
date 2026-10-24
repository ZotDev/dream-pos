import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
export const runtime='nodejs';
const matrix:Record<string,string[]>={
 super_admin:['*'],
 admin:['overview','pos','products','inventory','warehouses','purchases','customers','invoices','expenses','reports','employees','attendance','leave','payroll','accounting','users','stores','audit'],
 manager:['overview','pos','products','inventory','warehouses','purchases','customers','invoices','expenses','reports','employees','attendance','leave','tasks','stores'],
 cashier:['overview','pos','customers','invoices','returns'],
 inventory_manager:['overview','products','inventory','warehouses','purchases','reports'],
 store_keeper:['overview','products','inventory','warehouses','transfers'],
 salesman:['overview','pos','customers','quotations','invoices'],
 supervisor:['overview','pos','inventory','warehouses','transfers','attendance','leave','tasks'],
 delivery_biker:['overview','delivery','tasks'],
 employee:['overview','attendance','leave','tasks'],
 accountant:['overview','invoices','purchases','expenses','reports','payroll','accounting'],
 hr_manager:['overview','employees','attendance','leave','payroll','tasks']
};
export async function GET(){const a=await requireRole(['super_admin','admin']);if('error' in a)return a.error;return NextResponse.json({roles:Object.keys(matrix).map(role=>({role,permissions:matrix[role]}))});}
