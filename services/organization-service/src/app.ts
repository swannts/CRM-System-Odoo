import { createServiceApp } from "@mymanager/node-service-kit";
import { env } from "./config/index.js";
import { registerRoutes } from "./routes/index.js";

export function createApp() {
  const { app, logger } = createServiceApp({
    serviceName: env.serviceName,
    jsonLimit: env.jsonLimit,
    enableCors: env.enableCors,
  });

  registerRoutes(app);

  return { app, logger };
}
