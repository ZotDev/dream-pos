# Dream POS — Frontend / Backend Separation Contract

## Non-negotiable boundary

Frontend and backend changes must be implemented, reviewed, and verified as separate workstreams. Do not change UI components as part of backend hardening, and do not change database schema or server authorization as part of frontend styling work.

## Current state

The current repository is a Next.js application. UI components live under `app/` and `components/`; server-side API route handlers also live under `app/api/`, with database and session helpers under `lib/server/`. This is a shared deployment/codebase today, not yet two independently deployed services.

## Target architecture

- **Frontend application:** presentation, navigation, client-side form state, accessible UI, and API client only. It must not connect directly to PostgreSQL or contain database credentials.
- **Backend API service:** authentication/session validation, role and store authorization, request validation, business rules, transactions, audit logging, and PostgreSQL access.
- **Database:** Neon PostgreSQL, accessible only to the backend service.
- **Contract:** versioned HTTP/JSON API, with a documented base URL and consistent error shape. Frontend configuration may contain a public API base URL; it must never contain `DATABASE_URL` or `AUTH_SECRET`.

## Migration sequence

1. **Backend hardening (current workstream):** audit auth and role checks, input validation, transaction safety, store scoping, checkout idempotency, and safe error responses. Do not modify frontend components.
2. **Backend extraction:** move API handlers and server-only helpers into a standalone backend service/repository; preserve routes and response contracts. Add backend-only CI and staging checks.
3. **Frontend decoupling:** replace same-origin API assumptions with a typed API client configured by a public API base URL. This is a separate frontend-only change after the backend endpoint is deployed.
4. **Integration verification:** test login/session handling, CORS and cookie policy, checkout, stock, purchases, returns, reports, and health checks against staging.
5. **Production gate:** only promote after security checks, clean builds, automated API tests, and rollback verification pass.

## Security requirements for extraction

- Never copy real environment values into source control or documentation.
- Keep `DATABASE_URL` and `AUTH_SECRET` only in backend runtime secrets.
- Configure explicit allowed frontend origins; do not use wildcard CORS with credentials.
- If sessions use cookies across origins, configure Secure, HttpOnly, SameSite, credentials, and CSRF/origin protections together.
- Enforce authorization in the backend for every operation; hiding a frontend menu is not access control.
- Add tenant/store scoping to database queries before serving multiple stores.
- Keep health responses limited to service/database status and do not disclose credentials or raw exceptions.

## Completion status

This document records the separation contract and migration order. It does not claim that the services have already been extracted. The existing Next.js application remains the current deployment unit until the extraction and integration work is completed and verified.
