export function databaseConfig() {
  return {
    url: process.env.DATABASE_URL || '',
  };
}
