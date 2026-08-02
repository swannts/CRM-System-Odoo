import type { Express } from 'express';

import { registerIntegrationRoutes } from './integrations.routes.js';
import { registerPublicRoutes } from './public.routes.js';

export function registerRoutes(app: Express) {
  registerPublicRoutes(app);
  registerIntegrationRoutes(app);
}
