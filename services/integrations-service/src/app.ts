import { createServiceApp } from '@mymanager/node-service-kit';

import { config } from './config/index.js';
import { registerRoutes } from './routes/index.js';

const { app, logger } = createServiceApp({
  serviceName: config.serviceName,
  jsonLimit: config.jsonLimit,
});

registerRoutes(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: config.serviceName });
});

export { app, logger };

export default app;
