import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { ROLE_MODULE_KEYS, SERVER_ROLE_MODULE_ACCESS } from '@/lib/server/permissions';
export const runtime='nodejs';
export async function GET(){
 const a=await requireRole(['super_admin','admin']);if('error' in a)return a.error;
 return NextResponse.json({roles:Object.keys(SERVER_ROLE_MODULE_ACCESS).map(role=>({role,permissions:ROLE_MODULE_KEYS[role]||[],modules:SERVER_ROLE_MODULE_ACCESS[role]}))});
}
