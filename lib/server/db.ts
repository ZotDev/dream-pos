import { Pool } from 'pg';

declare global { var dreamPosPool: Pool | undefined }
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if (!global.dreamPosPool) global.dreamPosPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 });
  return global.dreamPosPool;
}
