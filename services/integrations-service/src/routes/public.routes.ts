import type { Express } from 'express';

import { WebhookController } from '../modules/integrations/index.js';

const webhookController = new WebhookController();

export function registerPublicRoutes(app: Express) {
  app.get('/v1/webhook/whatsapp', (req, res) => webhookController.verifyMeta(req, res));
  app.post('/v1/webhook/whatsapp', (req, res) => webhookController.handleMeta(req, res));
  app.post('/v1/webhook/telegram', (req, res) => webhookController.handleTelegram(req, res));
  app.post('/v1/webhook/telegram/:sessionId', (req, res) => webhookController.handleTelegram(req, res));
}
