import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireRole } from '@/lib/server/auth';
export const runtime='nodejs';
export async function GET(req:NextRequest){const a=await requireRole(['super_admin','admin']);if('error' in a)return a.error;const limit=Math.min(500,Math.max(1,Number(req.nextUrl.searchParams.get('limit')||200)));try{const r=await db().query(`SELECT al.id,al.action,al.entity_type,al.entity_id,al.metadata,al.created_at,u.full_name AS user_name,u.email FROM audit_logs al LEFT JOIN app_users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT $1`,[limit]);return NextResponse.json({auditLogs:r.rows});}catch(e){console.error(e);return NextResponse.json({error:'Could not load audit history'},{status:500});}}
