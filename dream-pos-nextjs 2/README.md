# Dream POS — Retail POS and Operations Suite

Next.js 14 / React 18 / TypeScript application with a PostgreSQL (Neon) backend. This iteration extends the initial POS/login/product/checkout work with persistent customer, supplier, purchase, expense, sales-report, stock-adjustment, returns, quotation, employee, leave-request and task APIs. The dashboard now reads its primary KPIs and recent transactions from the database, and the Customers, Purchases, Expenses and Reports screens are connected to backend data.

## Stack
- Next.js App Router, React, TypeScript
- Neon PostgreSQL using `pg`
- Scrypt password hashes and signed HTTP-only session cookies
- Transactional stock-changing workflows for checkout, received purchases, manual adjustments and returns

## Local setup
1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`; set `DATABASE_URL` and a strong random `AUTH_SECRET`.
4. Apply `db/schema.sql` to your Neon database if the schema has not already been applied.
5. If the evaluation accounts were created by an earlier seed run, refresh their password hashes using `DATABASE_URL='your Neon connection string' npm run seed:demo-passwords`.
6. Run `npm run dev` and open `http://localhost:3000`.

## Evaluation accounts
These are demo-only credentials. The `seed:demo-passwords` script computes fresh scrypt hashes for the following passwords; run it against the target database before testing if you are unsure that the hashes are current.

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@dreampos.demo` | `Dream@123` |
| Admin | `admin@dreampos.demo` | `Admin@123` |
| Manager | `manager@dreampos.demo` | `Manager@123` |
| Cashier | `cashier@dreampos.demo` | `Cashier@123` |
| Inventory Manager | `inventory@dreampos.demo` | `Stock@123` |
| Store Keeper | `storekeeper@dreampos.demo` | `Store@123` |
| Salesman | `salesman@dreampos.demo` | `Sales@123` |
| Supervisor | `supervisor@dreampos.demo` | `Super@123` |
| Delivery Biker | `delivery@dreampos.demo` | `Delivery@123` |
| Employee | `employee@dreampos.demo` | `Employee@123` |
| Accountant | `accountant@dreampos.demo` | `Accounts@123` |
| HR Manager | `hr@dreampos.demo` | `People@123` |

**Do not use these shared passwords for production.** Replace or disable all demo accounts before inviting store staff.

## API surface
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Products: `GET/POST /api/products`
- Checkout: `POST /api/sales` — transactionally records sale/items, decrements stock and creates movement records
- Dashboard: `GET /api/dashboard` — month sales, products, customers, expenses, low-stock items and recent sales
- Customers: `GET/POST /api/customers` (`q` search supported)
- Suppliers: `GET/POST /api/suppliers`
- Purchases: `GET/POST /api/purchases` — received purchases increase stock transactionally
- Expenses: `GET/POST /api/expenses` — finance-role restricted
- Manual inventory correction: `POST /api/stock/adjust`
- Sales analytics: `GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns: `GET/POST /api/returns` — checks quantities against original sale and previous returns; restores stock and logs movements
- Quotations: `GET/POST /api/quotations`
- HR: `GET/POST /api/employees`, `GET/POST/PATCH /api/leave-requests`
- Tasks: `GET/POST /api/tasks`
- Health probe: `GET /api/health` (returns only service/database status; no credentials)

## Verification
- `npm run check:project` validates the required project structure and enumerates API handlers. It is not a substitute for a build.
- `npm run build` and end-to-end tests must be run after dependencies can be installed. The current environment could not reach the npm registry, so compilation remains unverified.

## Current limitations / production checklist
- Run `npm ci` (or `npm install` if no lockfile exists) and `npm run build` before deployment. The current environment could not resolve `registry.npmjs.org`, so dependencies could not be installed and a successful production build has **not** been verified.
- The Vercel project exists, but no deployment is currently registered. `DATABASE_URL` is not confirmed in Vercel. Configure `DATABASE_URL` as an encrypted/sensitive environment variable and verify `AUTH_SECRET` is at least 32 characters, then deploy and check `/api/health`.
- A database seed/hash refresh is provided; run `npm run seed:demo-passwords` against the exact database before testing demo sign-in if needed.
- Some navigation sections (SaaS tenant administration, full payroll/accounting, shifts/attendance, file management, email/chat/calendar, warehouse transfers and multi-store tenant isolation) remain starter/placeholder screens.
- The current UI uses a role-specific menu preview. APIs have role checks on implemented write/read endpoints, but full tenant isolation and per-store row scoping are not yet implemented.
- Add rate limiting, login audit/lockout, CSRF/origin protection, password reset/MFA, automated tests, idempotency keys, complete refund/payment reconciliation, and store/tenant scoping before processing real transactions.
- Payment gateway, camera-based barcode decoding, product-image storage, real WhatsApp/SMS/email delivery and ESC/POS printer integration are not implemented. Browser print can be used as a basic print fallback.
- Review tax rules, invoice numbering, rounding, permissions, data retention and local tax compliance before production use.

## Deployment
Import this project into Vercel (or connect the `dream-pos` repository), set encrypted `DATABASE_URL` and `AUTH_SECRET` for Preview, Production and Development, run a clean build, and verify `/api/health`. Test login, checkout, purchase receiving, returns and reports against a non-production store before inviting users. Do not use the demo credentials or this build for live financial transactions until the production checklist above is complete.
