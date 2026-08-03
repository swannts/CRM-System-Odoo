# Build and CI Commands

This repository uses Yarn workspaces from the root `package.json`.

## Root

- Install: `yarn install --frozen-lockfile`
- Runtime safety check: `yarn check:no-hardcoded-runtime`
- Run unit test suites: `yarn test:unit`
- Run frontend E2E Cypress tests: `yarn test:e2e`
- Run all tests: `yarn test:all`

## Frontend

- Build: `yarn workspace micro-app build`

## Core backend services

- API Router build: `yarn workspace @mymanager/api-router-service build`
- API Router typecheck: `yarn workspace @mymanager/api-router-service typecheck`
- Odoo integration build: `yarn workspace odoo-integration-service build`
- Odoo integration tests: `yarn workspace odoo-integration-service test --runInBand`
- Email sync build: `yarn workspace @mymanager/email-sync-service build`
- Email sync tests: `yarn workspace @mymanager/email-sync-service test`
- Organization service build: `yarn workspace @mymanager/organization-service build`
- Booking service build: `yarn workspace booking-service build`
- Integrations service build: `yarn workspace @mymanager/integrations-service build`
- Realtime service build: `yarn workspace @mymanager/realtime-service build`

## Prisma (services with schema)

For each service below, run:

1. `npx prisma generate`
2. `npx prisma validate --schema=prisma/schema.prisma`

Services:

- `services/booking-service`
- `services/email-sync-service`
- `services/integrations-service`
- `services/odoo-integration-service`
- `services/organization-service`
- `services/realtime-service`

## Docker smoke builds

- `docker build -f services/api-router-service/docker/Dockerfile.dev -t crm/api-router:ci .`
- `docker build -f services/odoo-integration-service/docker/Dockerfile.dev -t crm/odoo-integration:ci .`
- `docker build -f services/email-sync-service/docker/Dockerfile.dev -t crm/email-sync:ci .`
- `docker build -f services/organization-service/docker/Dockerfile.dev -t crm/organization:ci .`
- `docker build -f services/booking-service/docker/Dockerfile.dev -t crm/booking:ci .`

## Agent compatibility smoke

- `./scripts/smoke-agent-compat.sh`
- Optional envs:
  - `BASE_URL` (default `http://localhost:8081`)
  - `ORG_ID` (default `00000000-0000-0000-0000-000000000001`)
  - `USER_ID` (default `00000000-0000-0000-0000-000000000002`)
  - `CONVERSATION_ID` (optional, enables `/api/agent/update_agent_in_chat` smoke call)
