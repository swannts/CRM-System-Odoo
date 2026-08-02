import type { Express } from 'express';

import {
  EasyPostController,
  FacebookController,
  GoogleController,
  ImageLibraryController,
  IntegrationController,
  InstagramController,
  LinkedInController,
  MagentoController,
  MetaIntegrationController,
  OdooController,
  ShopifyController,
  TelegramController,
  TikTokController,
  UberEatsController,
  UserIntegrationSettingsController,
  VoiceIntegrationController,
  WhatsAppController,
  ZoomController,
} from '../controllers/index.js';
import { identityMiddleware } from '../middleware/identity.js';

const auth = identityMiddleware;
const cast = (req: any) => req as any;

const integrationController = new IntegrationController();
const googleController = new GoogleController();
const zoomController = new ZoomController();
const facebookController = new FacebookController();
const instagramController = new InstagramController();
const linkedinController = new LinkedInController();
const tiktokController = new TikTokController();
const shopifyController = new ShopifyController();
const magentoController = new MagentoController();
const uberEatsController = new UberEatsController();
const easyPostController = new EasyPostController();
const settingsController = new UserIntegrationSettingsController();
const metaController = new MetaIntegrationController();
const voiceController = new VoiceIntegrationController();
const whatsappController = new WhatsAppController();
const telegramController = new TelegramController();
const odooController = new OdooController();
const imageLibraryController = new ImageLibraryController();

export function registerIntegrationRoutes(app: Express) {
  app.post('/v1/integrations/connect', auth, (req, res) => integrationController.connect(cast(req), res));
  app.get('/v1/integrations', auth, (req, res) => integrationController.getConnections(cast(req), res));
  app.post('/v1/integrations/disconnect', auth, (req, res) => integrationController.disconnect(cast(req), res));

  app.post('/v1/integrations/google/connect', auth, (req, res) => googleController.connect(cast(req), res));
  app.get('/v1/integrations/google', auth, (req, res) => googleController.getConnection(cast(req), res));
  app.get('/v1/integrations/google/reviews', auth, (req, res) => googleController.getReviews(cast(req), res));
  app.get('/v1/integrations/google/params', auth, (req, res) => googleController.getSecret(cast(req), res));

  app.post('/v1/integrations/zoom/connect', auth, (req, res) => zoomController.connect(cast(req), res));
  app.get('/v1/integrations/zoom', auth, (req, res) => zoomController.getConnection(cast(req), res));
  app.post('/v1/integrations/zoom/create-meeting', auth, (req, res) => zoomController.createMeeting(cast(req), res));
  app.get('/v1/integrations/zoom/meetings', auth, (req, res) => zoomController.getMeetings(cast(req), res));
  app.patch('/v1/integrations/zoom/update-meeting/:meetingId', auth, (req, res) => zoomController.updateMeeting(cast(req), res));
  app.delete('/v1/integrations/zoom/delete-meeting/:meetingId', auth, (req, res) => zoomController.deleteMeeting(cast(req), res));
  app.get('/v1/integrations/zoom/current-user', auth, (req, res) => zoomController.getCurrentUser(cast(req), res));
  app.post('/v1/integrations/zoom/generate-signature', auth, (req, res) => zoomController.generateSignature(cast(req), res));
  app.get('/v1/integrations/zoom/is-zoom-profile-exists', auth, (req, res) => zoomController.isProfileExists(cast(req), res));
  app.get('/v1/integrations/zoom/zoom-credentials', auth, (req, res) => zoomController.getCredentials(cast(req), res));

  app.post('/v1/integrations/facebook/connect', auth, (req, res) => facebookController.connect(cast(req), res));
  app.get('/v1/integrations/facebook/pages', auth, (req, res) => facebookController.getPages(cast(req), res));
  app.post('/v1/integrations/facebook/post', auth, (req, res) => facebookController.createPost(cast(req), res));
  app.get('/v1/integrations/facebook/campaigns-insights', auth, (req, res) => facebookController.getCampaignsInsights(cast(req), res));

  app.post('/v1/integrations/instagram/connect', auth, (req, res) => instagramController.connect(cast(req), res));
  app.post('/v1/integrations/instagram/post', auth, (req, res) => instagramController.createPost(cast(req), res));
  app.get('/v1/integrations/instagram/insights', auth, (req, res) => instagramController.getInsights(cast(req), res));

  app.post('/v1/integrations/linkedin/connect', auth, (req, res) => linkedinController.connect(cast(req), res));
  app.post('/v1/integrations/linkedin/post', auth, (req, res) => linkedinController.createPost(cast(req), res));

  app.post('/v1/integrations/tiktok/connect', auth, (req, res) => tiktokController.connect(cast(req), res));
  app.post('/v1/integrations/tiktok/video', auth, (req, res) => tiktokController.createVideo(cast(req), res));

  app.post('/v1/integrations/shopify/connect', auth, (req, res) => shopifyController.connect(cast(req), res));
  app.get('/v1/integrations/shopify/stores', auth, (req, res) => shopifyController.getStores(cast(req), res));
  app.get('/v1/integrations/shopify/products', auth, (req, res) => shopifyController.getProducts(cast(req), res));

  app.post('/v1/integrations/magento/connect', auth, (req, res) => magentoController.connect(cast(req), res));
  app.get('/v1/integrations/magento', auth, (req, res) => magentoController.getConnection(cast(req), res));
  app.post('/v1/integrations/magento/disconnect', auth, (req, res) => magentoController.disconnect(cast(req), res));
  app.get('/v1/integrations/magento/stores', auth, (req, res) => magentoController.getStores(cast(req), res));
  app.get('/v1/integrations/magento/products', auth, (req, res) => magentoController.getProducts(cast(req), res));
  app.get('/v1/integrations/magento/orders', auth, (req, res) => magentoController.getOrders(cast(req), res));
  app.get('/v1/integrations/magento/customers', auth, (req, res) => magentoController.getCustomers(cast(req), res));

  app.post('/v1/integrations/uber-eats/connect', auth, (req, res) => uberEatsController.connect(cast(req), res));
  app.get('/v1/integrations/uber-eats/orders', auth, (req, res) => uberEatsController.getOrders(cast(req), res));

  app.post('/v1/integrations/easypost/connect', auth, (req, res) => easyPostController.connect(cast(req), res));
  app.post('/v1/integrations/easypost/shipment', auth, (req, res) => easyPostController.createShipment(cast(req), res));
  app.post('/v1/integrations/easypost/rates', auth, (req, res) => easyPostController.getRates(cast(req), res));

  app.get('/v1/integrations/settings', auth, (req, res) => settingsController.getSettings(cast(req), res));
  app.put('/v1/integrations/settings', auth, (req, res) => settingsController.updateSettings(cast(req), res));

  app.get('/v1/integrations/meta', auth, (req, res) => metaController.getIntegration(cast(req), res));
  app.put('/v1/integrations/meta', auth, (req, res) => metaController.updateIntegration(cast(req), res));

  app.get('/v1/integrations/voice', auth, (req, res) => voiceController.getIntegration(cast(req), res));
  app.put('/v1/integrations/voice', auth, (req, res) => voiceController.updateIntegration(cast(req), res));

  app.get('/v1/integrations/whatsapp/instances', auth, (req, res) => whatsappController.getInstances(cast(req), res));
  app.post('/v1/integrations/whatsapp/instances', auth, (req, res) => whatsappController.createInstance(cast(req), res));
  app.delete('/v1/integrations/whatsapp/instances/:instanceId', auth, (req, res) => whatsappController.deleteInstance(cast(req), res));
  app.get('/v1/integrations/whatsapp/qr/:instanceId', auth, (req, res) => whatsappController.getQr(cast(req), res));
  app.get('/v1/integrations/whatsapp/status/:instanceId', auth, (req, res) => whatsappController.getStatus(cast(req), res));

  app.get('/v1/integrations/telegram/sessions', auth, (req, res) => telegramController.getSessions(cast(req), res));
  app.post('/v1/integrations/telegram/sessions', auth, (req, res) => telegramController.createSession(cast(req), res));
  app.delete('/v1/integrations/telegram/sessions/:sessionId', auth, (req, res) => telegramController.deleteSession(cast(req), res));
  app.post('/v1/integrations/telegram/send-otp', auth, (req, res) => telegramController.sendOtp(cast(req), res));
  app.post('/v1/integrations/telegram/verify-otp', auth, (req, res) => telegramController.verifyOtp(cast(req), res));

  app.post('/v1/integrations/odoo/connect', auth, (req, res) => odooController.connect(cast(req), res));
  app.get('/v1/integrations/odoo', auth, (req, res) => odooController.getConnection(cast(req), res));
  app.post('/v1/integrations/odoo/disconnect', auth, (req, res) => odooController.disconnect(cast(req), res));
  app.get('/v1/integrations/odoo/contacts', auth, (req, res) => odooController.getContacts(cast(req), res));
  app.get('/v1/integrations/odoo/invoices', auth, (req, res) => odooController.getInvoices(cast(req), res));
  app.post('/v1/integrations/odoo/sync/magento', auth, (req, res) => odooController.syncMagento(cast(req), res));

  app.get('/v1/image-library', auth, (req, res) => imageLibraryController.list(cast(req), res));
  app.post('/v1/image-library', auth, (req, res) => imageLibraryController.create(cast(req), res));
  app.delete('/v1/image-library/:id', auth, (req, res) => imageLibraryController.remove(cast(req), res));
}
