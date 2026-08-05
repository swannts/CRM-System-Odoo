# Microservices (New Architecture)

This directory contains the new microservices-based backend for **mymanager**.

**Core building blocks**
- API Gateway: **Nginx** (`gateway/nginx/nginx.conf`)
- Legacy gateway config (compat only): **KrakenD** (`gateway/krakend/krakend.json`)
- AuthN/AuthZ: **Keycloak** (`microservices/auth/keycloak`)
- Event-driven backbone: **RabbitMQ** (local via compose; Kubernetes manifests planned)
- Container orchestration: **Kubernetes** (`microservices/infra/k8s` - starting scaffold)

**Identity propagation**
The gateway validates the Keycloak JWT, then propagates identity context headers to downstream services:
- `X-User-Id` (from `sub`)
- `X-Org-Id` (from `org_id`)

Services should rely on these headers for multi-tenant request scoping.

## eCommerce / shop architecture

Magento integration is currently disabled in this repository's local/prod Docker configuration.

### Capability ownership

| Capability | Source of truth |
|---|---|
| Contacts | Odoo |
| Companies | Odoo |
| Sales activities | Odoo |
| Customer notes/timeline | Odoo |
| Organization users/roles | Organization service |
| Billing summaries/reporting | Odoo accounting/invoice data |

### Remaining service scope notes

- `services/commerce-service`: deprecated legacy compatibility only, no new business features.
- `services/finance-service`: platform-specific reporting/aggregation only, not accounting source of truth.
- `services/payments-service`: platform payment integration/orchestration only, not accounting source of truth.
- `services/pos-service`: pending ownership decision; treat as legacy until Odoo POS replacement/cutover is finalized.

## Docker Modes

The Docker stack now supports three intended modes:

- `development`: local coding with bind mounts, watchers, and fast feedback
- `web-test`: production-like runtime commands plus seeded dummy data for demos/QA
- `production`: production-oriented commands and env wiring for real-user environments

Compose layout is now organized per environment and per concern:

- `infra/compose/dev/`
- `infra/compose/test/`
- `infra/compose/prod/`

Each environment has exactly:

- `docker-compose.databases.yml`
- `docker-compose.platform.yml`
- `docker-compose.services.yml`
- `docker-compose.ui.yml`
- `docker-compose.gateway.yml`
- `docker-compose.yml` (entrypoint that includes the five files above)

### Local development

Use the unified manager:

```bash
./manage.sh dev up
```

This mode keeps the current repo-mounted workflow:
- `tsx watch` / `next dev`
- Prisma `db push` on service boot where needed
- local ports published for direct debugging

### Web testing with dummy data

```bash
./manage.sh test up
```

This mode uses `infra/compose/test/*` and provides:
- frontend runs with `next build && next start`
- Node services switch from watch mode to `build && start`
- a one-shot `seed-dummy-data` container populates projects, contacts, and invoices
- good for shared QA environments, demos, or browser-based review

The dummy seeder reads Docker-friendly env vars from:
- `.env.docker.web-test.example`

### Production mode

1. Copy the example env file and replace placeholders:

```bash
cp .env.docker.prod.example .env.docker.prod
```

2. Start the production-oriented stack:

```bash
./manage.sh prod up
```

This mode uses `infra/compose/prod/*` and provides:
- frontend and Node services run in `NODE_ENV=production`
- services use `build && start` rather than watch mode
- restart policies are enabled for long-running services
- env values are pulled from `.env.docker.prod`

This is intended as the repo’s “real user” compose entrypoint until a fully image-driven deployment pipeline replaces the current source-mounted setup.

## Previous Local Development

Start the platform stack:

```bash
docker compose -f microservices/infra/compose/dev/docker-compose.yml up --build
```

Key endpoints (defaults):
- Keycloak: `http://localhost:8080` (admin/admin)
- Nginx gateway: `http://localhost:8081`

Smoke tests:
- `GET http://localhost:8081/health`

## Build and CI Command Reference

- See `docs/build-and-ci-commands.md` for the canonical repo, frontend, service, Prisma, and Docker smoke commands used by CI.

## Services

Services live under `microservices/services/*`.

- `organization-service` (Node/Express): org metadata and settings
- `odoo-integration-service` (Node/TypeScript): Odoo ERP/CRM/accounting bridge
- `notification-service` (Node worker): consumes events and delivers notifications
- `realtime-service` (Node + Socket.IO): real-time updates channel (event fanout)
