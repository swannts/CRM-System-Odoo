export function validateEnv(config: Record<string, unknown>) {
  const port = Number(config.PORT ?? 7040);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid integer between 1 and 65535.');
  }

  if (!String(config.DATABASE_URL ?? '').trim()) {
    throw new Error('DATABASE_URL is required.');
  }

  return config;
}
