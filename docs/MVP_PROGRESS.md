# CRM MVP Progress

Updated: 2026-09-10

## Milestones

| Milestone | Status | Evidence / blocker |
| --- | --- | --- |
| 1. Reliable build | In progress | Clean detached checkout completed `corepack yarn install --frozen-lockfile` successfully. Prisma, all seven backend builds, and all five Docker smoke builds pass in a disposable current-source copy. Frontend lint/typecheck still fail on existing source debt. The main checkout cannot relink dependencies because of root-owned `services/email-sync-service/node_modules` artifacts. |
| 2. Authentication and authorization | In progress | Membership validation is now enforced for API-router, Odoo, integrations, email-sync, realtime HTTP paths, and Socket.IO packets. Implicit organization/membership bootstrap was removed, verified expiration is required, caller identity headers are stripped, and token refresh/logout rotate or close realtime sessions. Service-account token support is implemented; per-organization service-account provisioning and live session tests remain. |
| 3. Tenant isolation | Blocked by 2 | Organization-to-Odoo mapping is not yet documented in executable configuration or enforced across all Odoo operations. |
| 4. Onboarding and team management | Not started | — |
| 5. Contacts and companies | Not started | — |
| 6. Sales pipelines | Not started | — |
| 7. Tasks and booking | Not started | — |
| 8. Notifications and dashboard | Not started | — |
| 9. Release preparation | Not started | — |

## Milestone 1 changes

- Yarn `1.22.22` is the canonical package manager; the duplicate npm lockfile
  was removed and Node.js `20` through `24` is declared as supported.
- Added root commands for frontend typechecking, linting, service builds, and
  explicit Prisma generate/validate checks.
- Added typed exports for the shared JavaScript service kit so strict backend
  builds can resolve its workspace package.
- Corrected Prisma discovery for the booking schema nested under `src/` and
  made Prisma validation runnable without a credential by using a local-only
  placeholder URL when `DATABASE_URL` is unset.
- Added `docs/MVP_ARCHITECTURE.md`, `docs/ENVIRONMENT.md`, and this progress
  record.

## Milestone 2 changes

- Added required-expiration enforcement to shared RS256/JWKS token
  verification.
- Added shared organization membership resolution based only on the verified
  bearer token and selected organization; `X-User-Id` is no longer sent as an
  identity source.
- Made organization membership lookup side-effect free. Unknown organizations
  and callers no longer receive implicit owner/staff memberships.
- Enforced membership on API-router and Odoo requests, propagated the verified
  bearer token for integrations, and stripped spoofable identity headers from
  router forwarding.
- Secured realtime channel room joins to active channels belonging to the
  authenticated organization and stopped caller-supplied user IDs from being
  used in editing presence events.
- Protected legacy realtime chat history/message routes and disabled the
  unscoped public widget-settings route until an opaque public-token contract
  exists.
- Switched the realtime frontend hook from `localStorage` to the existing
  session-scoped access token.
- Repaired the organization service health test so it exercises the real HTTP
  listener.
- Declared `jsonwebtoken` in the shared service-kit package and resolved it
  through Node's module loader so standalone service images can start with the
  file-linked shared package.
- Added the `mymanager-web` audience mapper to the checked-in Keycloak fixture
  for reproducible access-token verification.
- Removed the legacy `system-sync` identity from Magento sync requests. Sync
  requests now forward the authenticated bearer token and selected organization;
  calls without a bearer token fail closed.
- Added cached Keycloak client-credentials support for independent background
  jobs. The resulting service-account token is still checked against normal
  organization membership; no privileged bypass was added.
- Revalidated Socket.IO packets against the signed token and current active
  membership, rotated the socket when the frontend refreshes a token, and
  disconnect it during logout.

## Verification record

- Fetched `origin/main`; local `main` matched commit `e4e0450` before work.
- Fixed the Docker CI smoke commands to pass the required `SERVICE_NAME` build
  argument; without it, all five Dockerfiles failed before their build steps.
- `docker build` passed for all five CI images with the corrected arguments.
- Fixed an API-router compile regression in the compatibility `/auth/me` path
  by resolving the verified identity before reading its claims.
- `corepack yarn install --frozen-lockfile`: passed in disposable clean
  worktree.
- `yarn prisma:check`: passed all six schemas using the local-only placeholder
  URL when `DATABASE_URL` is unset.
- `yarn build:services`: all seven backend service builds passed in a
  disposable copy of the current source after each Prisma-owning service
  generated its client before compilation.
- `yarn typecheck:frontend`: currently fails with the existing strict-mode
  errors across theme/navigation and other frontend files.
- `yarn lint:frontend`: currently fails with 96 errors and 915 warnings in the
  existing frontend source; this is exposed as a CI gate rather than hidden.
- `yarn workspace micro-app build`: now runs lint/type validation instead of
  skipping them and fails on the same existing lint debt.
- Shared auth regression tests cover missing bearer tokens and unsigned/forged
  JWT rejection; live JWKS and Keycloak membership integration tests require a
  running auth environment and are not yet verified. The local test attempt is
  blocked by the existing broken `node_modules/jsonwebtoken/index.js` artifact
  in the main checkout; rerun after a clean install.
- The main checkout rerun of `corepack yarn install --frozen-lockfile` reached
  linking and then hit root-owned `services/email-sync-service/node_modules`
  artifacts (`EACCES`); this is an environment blocker, not a lockfile
  resolution failure.
- After correcting the `yarn.lock` selector for direct `jsonwebtoken`, frozen
  install resolves the lock successfully but local linking remains blocked by
  root-owned `services/email-sync-service/node_modules` artifacts.
- Local checkout build attempts also hit root-owned `.next`, `dist`, and
  service `node_modules` artifacts; those are environment artifacts, not
  committed files.
- Shared auth tests: 4 passed, covering missing bearer, unsigned/forged JWT,
  missing expiration, and membership resolution without caller user headers.
- Organization service tests: 2 passed against a real ephemeral HTTP listener.
- Backend service builds: all 7 passed after Milestone 2 changes in the
  disposable current-source copy.
- Realtime public-surface review: unauthenticated history/message access was
  removed and the arbitrary-user public settings lookup was disabled.
- A disposable Docker fixture was started with Keycloak, PostgreSQL, Kafka,
  and organization-service. Real Keycloak access tokens verified an active
  owner (200), disabled viewer (403), and unknown organization (403) through
  `/v1/memberships/me`. A token issued with the external `localhost` issuer
  was rejected by the service configured for the internal issuer, confirming
  issuer validation.
- Logout/refresh behavior and invalid-audience behavior still need a live
  identity-provider test harness; the unit suite covers signature, audience,
  and expiration validation paths. Socket.IO unauthorized-room behavior still
  needs a live client test.
- Interactive Odoo Magento sync forwards the verified caller token. Independent
  background workers use `SERVICE_CLIENT_ID` and `SERVICE_CLIENT_SECRET`; their
  service-account memberships must be provisioned per organization before jobs
  can run.

## Next

Provision service-account memberships in the organization service, then finish
live Keycloak login/logout/refresh and invalid-audience coverage. After that,
complete tenant isolation before advancing to onboarding.

## Feature implementation batch: 2026-09-10

Branch: `codex/mvp-features`, based on `a6c3a75`.

Implemented in source, with integration verification still pending:

- Workspace creation and selection, initial owner membership, invitation creation,
  expiry, revocation, and verified-email acceptance. Invitation links are manually
  shareable; no outbound invitation email is sent. New `/workspace-setup/` screen
  and navigation entry. Workspace selection survives token refresh and is sent
  through the existing Axios client.
- Sales opportunity PATCH-to-PUT compatibility, stale proxy Content-Length removal,
  partial updates that preserve lead type, and explicit active/lost updates.
- Contact CSV validation with file/row limits, duplicate-email skipping, row-level
  result reporting, and an actual downloadable CSV template. Excel is not supported.
- Public booking now displays real available slots and submits guest details.
  Booking timezone, availability, buffering, public status restrictions, cancellation,
  and rescheduling checks are implemented. Appointment writes use a PostgreSQL
  transaction advisory lock per organization before checking overlapping records.
  A live concurrent PostgreSQL test is still required before claiming this verified.
- Internal appointment confirmation/completion/cancellation/rescheduling controls refresh the list
  after writes. Booking-type forms reset when switching records and provide timezone
  and weekly availability editing.
- Booking management API update routes and array response normalization repaired.
  Booking mutations verify membership and role; booking-type updates check ownership.
- Notifications persist in PostgreSQL and support recipient-scoped list/count/read/
  seen/archive operations. Payment events and due agent tasks generate idempotent
  notifications. Kafka handler errors are rethrown rather than acknowledged as success.
- Dashboard collection reads fetch all pages or fail explicitly; lead/opportunity
  counts use record type. Overview source outages return an error rather than zeros.
  Full date-range/currency semantics remain to be completed.
- Runtime declared as Node 24, matching existing service Dockerfiles. CI now uses
  Node 24 instead of the Node 20 runtime rejected by Azure Identity dependencies.

Verification performed:

- Six actual scheduling/pagination logic tests pass, including Dhaka timezone,
  daylight-saving gaps, invalid/past slots, pagination truncation, changing totals,
  and upstream errors.
- TypeScript transpilation syntax checks pass for the modified source files. This
  is NOT a semantic typecheck or a successful application build.
- Runtime hardcoding check passes; whitespace checks pass.
- Full dependency installation did not complete in this environment. The online
  installation was interrupted; offline installation confirms required packages
  are missing from cache. Full builds, Prisma generation, and live database/auth
  integration tests remain unverified.
- `graphify update .` cannot run because the command is not installed.

Database rollout prerequisites (not executed against any live database):

- Existing booking DB: apply `services/booking-service/scripts/add-booking-timezone.sql`.
- Existing organization DB: apply `services/organization-service/scripts/add-organization-invitations.sql`.
- Realtime DB: apply the new notification migration using the existing migration procedure.
- Regenerate each service's Prisma client before compiling/running it.
- Booking availability defaults to UTC; configure the booking type's IANA timezone
  explicitly to preserve the intended business schedule.

Still outstanding; do not mark the MVP complete:

- Odoo tenant isolation and provisioning. Newly created workspaces must not be used
  for real customer data before Odoo isolation is implemented and tested.
- Full assignment/reminder coverage for CRM activities and booking events (the new
  reminder worker currently covers realtime agent tasks).
- Complete date/currency dashboard semantics.
- Live invitation, booking concurrency, notification persistence, and cross-tenant
  integration tests; frontend lint/typecheck; production readiness gates.
