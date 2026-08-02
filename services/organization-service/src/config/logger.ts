import { env } from "./env.js";

export const loggerConfig = {
  serviceName: env.serviceName,
  environment: env.nodeEnv,
};
