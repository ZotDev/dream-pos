import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
export type SessionUser = { id: number; name: string; email: string; role: string; storeId: number | null };
const COOKIE = 'dreampos_session';
function sign(payload: string) { const secret = process.env.AUTH_SECRET; if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters'); return createHmac('sha256', secret).update(payload).digest('base64url'); }
export function createSession(user: SessionUser) { const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString('base64url'); return `${payload}.${sign(payload)}`; }
export function sessionCookie(value: string) { cookies().set(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 }); }
export function clearSessionCookie() { cookies().set(COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 }); }
export async function getSession(): Promise<SessionUser | null> {
 const raw = cookies().get(COOKIE)?.value; if (!raw || raw.length > 4096) return null;
 const separator = raw.lastIndexOf('.'); if (separator <= 0 || separator === raw.length - 1) return null;
 const payload = raw.slice(0, separator); const signature = raw.slice(separator + 1);
 try {
  const expected = sign(payload); const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a,b)) return null;
  const data = JSON.parse(Buffer.from(payload,'base64url').toString());
  if (!Number.isSafeInteger(data.id) || data.id <= 0 || typeof data.name !== 'string' || typeof data.email !== 'string' || typeof data.role !== 'string' || !Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
  return { id:data.id, name:data.name, email:data.email, role:data.role, storeId:Number.isSafeInteger(data.storeId) ? data.storeId : null };
 } catch { return null; }
}
export async function requireSession() { const user = await getSession(); if (!user) return { error: Response.json({error:'Authentication required'}, {status:401}) } as const; return { user } as const; }
export async function requireRole(allowed: string[]) { const result = await requireSession(); if ('error' in result) return result; if (!allowed.includes(result.user.role)) return { error: Response.json({error:'Insufficient permissions'}, {status:403}) } as const; return result; }
export async function verifyPassword(password: string, stored: string) {
 const { scrypt, timingSafeEqual: safe } = await import('node:crypto');
 const [algorithm, salt, hash] = stored.split('$'); if (algorithm !== 'scrypt' || !salt || !hash) return false;
 const derived = await new Promise<Buffer>((resolve,reject)=>scrypt(password, Buffer.from(salt,'hex'), 64, (err,key)=>err?reject(err):resolve(key as Buffer)));
 const expected = Buffer.from(hash,'hex'); return derived.length===expected.length && safe(derived, expected);
}
