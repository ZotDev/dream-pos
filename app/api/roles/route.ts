import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

export const runtime='nodejs';

export async function GET() {
  const auth = await requireRole(['super_admin','admin']);
  if ('error' in auth) return auth.error;
  try {
    const result = await db().query(
      `SELECT r.id,r.role_key AS role,r.name,r.description,r.is_system,r.is_active,
              COUNT(DISTINCT ura.user_id)::int AS assigned_users,
              COALESCE(array_agg(DISTINCT p.permission_key) FILTER (WHERE p.permission_key IS NOT NULL),'{}') AS permissions,
              COALESCE(array_agg(DISTINCT p.module_key) FILTER (WHERE p.module_key IS NOT NULL),'{}') AS modules
       FROM app_roles r
       LEFT JOIN app_role_permissions rp ON rp.role_id=r.id
       LEFT JOIN app_permissions p ON p.id=rp.permission_id
       LEFT JOIN app_user_role_assignments ura ON ura.role_id=r.id AND ura.is_active=true
       WHERE r.organization_id IS NULL OR r.organization_id IN (
         SELECT id FROM saas_tenants WHERE owner_email=$1
       )
       GROUP BY r.id ORDER BY r.is_system DESC,r.name ASC`,
      [auth.user.email],
    );
    return NextResponse.json({ roles: result.rows, source:'database', note:'System roles are platform-controlled. Organization custom roles require a valid tenant membership and scoped assignment.' });
  } catch (error) {
    console.error('Role permissions query failed', error);
    return NextResponse.json({ error:'Role permission store is unavailable. Apply the RBAC migration.' },{status:503});
  }
}
