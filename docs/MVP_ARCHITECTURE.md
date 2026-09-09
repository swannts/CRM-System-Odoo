# CRM MVP Architecture

## Service ownership

- Odoo remains the source of truth for contacts, companies, leads,
  opportunities, pipelines, and existing accounting data.
- The organization service owns organizations, memberships, roles, invitations,
  and application permissions.
- The booking service owns booking types, availability, appointments, and
  appointment reminders.
- Persistent notification records belong to the service that owns the related
  application event; delivery must be idempotent.

## Tenant boundary

The authenticated organization is selected by the request context and must be
validated against the authenticated user's active membership. Every Odoo
read, search, write, relation, import, export, and aggregate must apply the
organization-to-Odoo mapping. The mapping is not yet complete in the current
codebase and is a Milestone 3 prerequisite; no shared Odoo account may be
treated as sufficient tenant isolation.

Database-backed services must apply the same organization boundary in their
queries and relation checks. Public booking routes are intentionally scoped to
published booking types and opaque public tokens and must never expose internal
appointment lists or unrelated customer data.

## Runtime decisions

- Yarn `1.22.22` and Node.js `20` through `24` are the supported local and CI
  versions. Yarn is the canonical package manager and `yarn.lock` is the
  canonical lockfile.
- Prisma commands use explicit schema paths discovered by
  `scripts/check-prisma.mjs`; this handles services whose schema is nested
  below `src/`.
- Deferred modules remain in the repository for now, but must not be exposed
  through MVP navigation or unauthenticated routes.

## Authentication boundary

HTTP services accept only Keycloak access tokens signed with the configured
RS256 JWKS key, issuer, audience, and required expiration. The authenticated
user is derived from the verified `sub` claim; `X-User-Id`, role, email, and
name headers are not identity sources and are stripped from router hops.
`X-Org-Id` is only a selected organization context and must resolve to an
active membership before protected service access or role checks pass. The
organization service is the membership authority and therefore verifies the
token locally before doing its side-effect-free membership lookup.

Socket.IO verifies the handshake token and selected organization before
connection, binds room names to that organization, and ignores caller-supplied
user IDs. Resource rooms are checked against organization ownership where the
service owns the resource. Background workers must use an explicit service
credential; legacy `system-sync` header calls are denied. Service jobs use
Keycloak client credentials, and their service-account subject must have an
active membership in each organization it processes.

Membership provisioning is never implicit. Organization creation and initial
owner assignment must happen through an explicit retry-safe onboarding flow;
an authenticated request selecting an unknown organization cannot create it or
grant itself a role.
