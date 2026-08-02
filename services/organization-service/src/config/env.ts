export const env = {
  serviceName: process.env.SERVICE_NAME || "organization-service",
  port: Number(process.env.PORT || 7010),
  jsonLimit: process.env.JSON_LIMIT || "1mb",
  enableCors: process.env.ENABLE_CORS === "true",
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "",
};
