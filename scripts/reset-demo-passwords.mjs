import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';
const scrypt=promisify(scryptCallback);
if(!process.env.DATABASE_URL){console.error('Set DATABASE_URL before running this script.');process.exit(1)}
const users=[
 ['superadmin@dreampos.demo','Dream@123'],['admin@dreampos.demo','Admin@123'],['manager@dreampos.demo','Manager@123'],['cashier@dreampos.demo','Cashier@123'],['inventory@dreampos.demo','Stock@123'],['storekeeper@dreampos.demo','Store@123'],['salesman@dreampos.demo','Sales@123'],['supervisor@dreampos.demo','Super@123'],['delivery@dreampos.demo','Delivery@123'],['employee@dreampos.demo','Employee@123'],['accountant@dreampos.demo','Accounts@123'],['hr@dreampos.demo','People@123']
];
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:1});
try{for(const [email,password] of users){const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,Buffer.from(salt,'hex'),64);const result=await pool.query('UPDATE app_users SET password_hash=$1,is_active=true,updated_at=NOW() WHERE email=$2',[`scrypt$${salt}$${hash.toString('hex')}`,email]);if(!result.rowCount)console.warn(`No account found: ${email}`);else console.log(`Password hash refreshed: ${email}`)}console.log('Demo account password hashes refreshed. Rotate these credentials before production use.')}finally{await pool.end()}
