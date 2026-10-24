import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Minimal operational probe for Vercel and uptime monitors. Never returns credentials. */
export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    await db().query('SELECT 1');
    return NextResponse.json(
      { status: 'ok', service: 'dream-pos', database: 'ok', checkedAt },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'degraded', service: 'dream-pos', database: 'unavailable', checkedAt },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
