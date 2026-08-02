import { createApp } from "./app.js";
import { env } from "./config/index.js";

const { app, logger } = createApp();

app.listen(env.port, "0.0.0.0", () => logger.info({ port: env.port }, "organization-service listening (Clean Arch TS)"));
