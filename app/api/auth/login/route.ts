import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { createSession, sessionCookie, verifyPassword } from '@/lib/server/auth';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
 try {
  const body = await request.json(); const email = String(body.email ?? '').trim().toLowerCase(); const password = String(body.password ?? '');
  if (!email || !password || email.length > 254 || password.length > 256) return NextResponse.json({error:'Email and password are required'}, {status:400});
  const result = await db().query('SELECT id, full_name, email, password_hash, role, store_id, is_active FROM app_users WHERE lower(email)=lower($1) LIMIT 1',[email]);
  const row = result.rows[0]; if (!row || !row.is_active || !(await verifyPassword(password,row.password_hash))) return NextResponse.json({error:'Invalid email or password'}, {status:401});
  const user = {id:Number(row.id),name:row.full_name,email:row.email,role:row.role,storeId:row.store_id===null?null:Number(row.store_id)};
  const response = NextResponse.json({user}); response.cookies.set('dreampos_session',createSession(user),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*12}); return response;
 } catch (e) { console.error('Login error',e); return NextResponse.json({error:'Authentication service unavailable. Check database configuration.'},{status:500}); }
}
