import type { Express } from 'express';

import emailRoutes from '../modules/email-sync/email-sync.routes.js';

export function registerRoutes(app: Express) {
  app.use('/api/v1/email', emailRoutes);
}

export { emailRoutes };
