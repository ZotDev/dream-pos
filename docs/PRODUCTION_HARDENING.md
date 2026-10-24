# Dream POS — production hardening roadmap

This checklist is intended to be completed against a staging deployment before enabling real stores or financial transactions.

## Release gates

- [ ] Pin the supported Node.js and package versions; commit a package lockfile and use `npm ci` in CI.
- [ ] Run a clean `npm run build` on every pull request.
- [ ] Add automated tests for login/logout, role authorization, checkout, purchase receiving, returns, stock adjustment, and reports.
- [ ] Replace shared demo credentials; verify every demo account is disabled or password-rotated in production.
- [ ] Confirm production and preview have the required encrypted `DATABASE_URL` and `AUTH_SECRET`; never print their values in logs.
- [ ] Enforce authorization inside every API handler, not only in UI navigation.
- [ ] Add rate limiting and login throttling, audit failed login attempts, and implement password reset/MFA before handling sensitive staff data.
- [ ] Validate request bodies, amounts, quantities, dates, and enum values server-side.
- [ ] Scope every data access by tenant/store after a migration and backfill plan has been reviewed.
- [ ] Add idempotency protection for checkout and refund requests.
- [ ] Verify database transactions and row locks prevent overselling under concurrent checkout.
- [ ] Add security headers, CSP, and origin/CSRF checks for cookie-authenticated mutations.
- [ ] Verify invoice numbering, tax rounding, refund reconciliation, backups, restore procedure, retention, and monitoring.
- [ ] Run browser end-to-end tests against staging and confirm rollback procedure before production release.

## Implementation order

1. CI/build repeatability and error recovery.
2. API authorization and input validation audit.
3. Transactional checkout, idempotency, and refund reconciliation.
4. Tenant/store isolation migration.
5. Attendance/shifts, warehouse transfers, payroll/accounting, and SaaS administration.
6. Printer, barcode scanner, PDF invoices, and opt-in messaging integrations.

## Important

Do not apply tenant/store schema changes directly to a live database without a reviewed migration and a verified backup. Do not use the shared demo credentials for a production deployment.
