# Environment configuration

Use local `.env` files or the deployment secret store. Never commit values
for passwords, private keys, tokens, encryption keys, or database URLs.

## Required service configuration

- `DATABASE_URL`: database connection string for the service being run.
- `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`: Keycloak issuer and
  client configuration.
- `ORGANIZATION_SERVICE_URL`: internal organization-service URL used for
  membership resolution.
- `TOKEN_ENCRYPTION_KEY`: 64-character hexadecimal key for encrypted OAuth
  tokens.
- `ALLOWED_ORIGIN`: browser origin allowed by service CORS.
- `INTERNAL_SERVICE_TOKEN`: optional only for explicitly configured
  service-to-service jobs; it must be a real short-lived Keycloak bearer token
  with the required organization membership. Do not replace it with a caller
  identity header or a shared privileged user.
- `SERVICE_CLIENT_ID`, `SERVICE_CLIENT_SECRET`: client-credentials settings
  for independent background workers. The Keycloak service account identified
  by this client must be an active membership in every organization it will
  process; the worker still sends `X-Org-Id` for each job.

## Optional integrations and runtime settings

`KAFKA_BROKERS`, `REDIS_URL`, `ODOO_INTEGRATION_SERVICE_URL`,
`MAGENTO_INTEGRATION_SERVICE_URL`, `LOG_LEVEL`, `PORT`, `SERVICE_PORT`,
`JSON_LIMIT`, and provider-specific redirect/webhook settings are only
required by the corresponding service or integration.

Frontend variables prefixed with `NEXT_PUBLIC_` are public by design. Do not
put credentials or private provider secrets in them. Cypress credentials and
Keycloak bootstrap credentials belong only in local or CI secret storage.
