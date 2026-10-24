import { randomBytes,scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { requireRole } from '@/lib/server/auth';
export const runtime='nodejs';
const scrypt=promisify(scryptCallback);
const validRoles=['super_admin','admin','manager','cashier','inventory_manager','store_keeper','salesman','supervisor','delivery_biker','employee','accountant','hr_manager'];
export async function GET(req:NextRequest){
 const purpose=req.nextUrl.searchParams.get('purpose')||'admin';
 const allowed=purpose==='delivery'?['super_admin','admin','manager','supervisor','cashier','salesman']:purpose==='assignees'?['super_admin','admin','manager','supervisor','hr_manager']:['super_admin','admin'];
 const a=await requireRole(allowed);if('error' in a)return a.error;
 try{
  if(purpose==='delivery'){
   const r=await db().query("SELECT id,full_name,email,role,store_id,is_active FROM app_users WHERE is_active=true AND role='delivery_biker' AND ($1::boolean=true OR store_id=$2 OR store_id IS NULL) ORDER BY full_name",[['super_admin','admin'].includes(a.user.role),a.user.storeId]);
   return NextResponse.json({users:r.rows});
  }
  if(purpose==='assignees'){
   const r=await db().query("SELECT id,full_name,email,role,store_id,is_active FROM app_users WHERE is_active=true AND ($1::boolean=true OR store_id=$2 OR id=$3) ORDER BY full_name",[['super_admin','admin'].includes(a.user.role),a.user.storeId,a.user.id]);
   return NextResponse.json({users:r.rows});
  }
  const r=await db().query('SELECT u.id,u.full_name,u.email,u.role,u.store_id,u.is_active,u.created_at,s.name store_name FROM app_users u LEFT JOIN stores s ON s.id=u.store_id ORDER BY u.full_name');
  return NextResponse.json({users:r.rows,roles:validRoles});
 }catch(e){console.error(e);return NextResponse.json({error:'Could not load users'},{status:500});}
}
export async function POST(req:NextRequest){const a=await requireRole(['super_admin','admin']);if('error' in a)return a.error;const b=await req.json().catch(()=>null);const name=String(b?.name||'').trim(),email=String(b?.email||'').trim().toLowerCase(),role=String(b?.role||''),password=String(b?.password||''),storeId=b?.storeId?Number(b.storeId):a.user.storeId;if(!name||!/^\S+@\S+\.\S+$/.test(email)||!validRoles.includes(role)||password.length<10)return NextResponse.json({error:'Name, valid email, supported role and password of at least 10 characters are required'},{status:400});if(a.user.role==='admin'&&role==='super_admin')return NextResponse.json({error:'Only a super admin can create another super admin'},{status:403});if(storeId!==null&&(!Number.isInteger(storeId)||storeId<=0))return NextResponse.json({error:'Invalid store assignment'},{status:400});try{const salt=randomBytes(16).toString('hex'),hash=await scrypt(password,Buffer.from(salt,'hex'),64);const r=await db().query('INSERT INTO app_users(full_name,email,password_hash,role,store_id) VALUES($1,$2,$3,$4,$5) RETURNING id,full_name,email,role,store_id,is_active,created_at',[name,email,`scrypt$${salt}$${(hash as Buffer).toString('hex')}`,role,storeId]);await db().query("INSERT INTO audit_logs(user_id,action,entity_type,entity_id) VALUES($1,'create','app_user',$2)",[a.user.id,String(r.rows[0].id)]);return NextResponse.json({user:r.rows[0]},{status:201});}catch(e:any){if(e?.code==='23505')return NextResponse.json({error:'Email already exists'},{status:409});console.error(e);return NextResponse.json({error:'Could not create user'},{status:500});}}
export async function PATCH(req:NextRequest){const a=await requireRole(['super_admin','admin']);if('error' in a)return a.error;const b=await req.json().catch(()=>null);const id=Number(b?.id),role=String(b?.role||''),active=b?.isActive;if(!Number.isInteger(id)||id<=0||!validRoles.includes(role)||typeof active!=='boolean')return NextResponse.json({error:'User ID, valid role and active state are required'},{status:400});if(id===a.user.id&&(!active||role!==a.user.role))return NextResponse.json({error:'You cannot deactivate or change your own role'},{status:400});if(a.user.role==='admin'&&role==='super_admin')return NextResponse.json({error:'Only a super admin can assign the super admin role'},{status:403});try{const r=await db().query('UPDATE app_users SET role=$1,is_active=$2,updated_at=NOW() WHERE id=$3 RETURNING id,full_name,email,role,store_id,is_active',[role,active,id]);if(!r.rows[0])return NextResponse.json({error:'User not found'},{status:404});await db().query("INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES($1,'update','app_user',$2,$3::jsonb)",[a.user.id,String(id),JSON.stringify({role,isActive:active})]);return NextResponse.json({user:r.rows[0]});}catch(e){console.error(e);return NextResponse.json({error:'Could not update user'},{status:500});}}
