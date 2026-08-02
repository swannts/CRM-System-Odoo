import { createServiceApp } from '@mymanager/node-service-kit';

import { registerRoutes } from './routes/index.js';

const { app, logger } = createServiceApp({
  serviceName: 'email-sync-service',
  enableCors: false,
});

registerRoutes(app);

app.get('/health', (_req: any, res: any) => {
  res.json({
    status: 'healthy',
    service: 'email-sync-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export { app, logger };

export default app;
