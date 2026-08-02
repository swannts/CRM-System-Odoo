import { Response } from 'express';
import { getRouteParam } from '../common/utils/route-param.js';
import { 
  IntegrationConnectionService,
  GoogleIntegrationService,
  ZoomIntegrationService,
  FacebookIntegrationService,
  InstagramIntegrationService,
  LinkedInIntegrationService,
  TikTokIntegrationService,
  ShopifyIntegrationService,
  MagentoIntegrationService,
  UberEatsIntegrationService,
  EasyPostIntegrationService,
  WhatsAppService,
  TelegramService,
  UserIntegrationSettingsService,
  MetaIntegrationService,
  VoiceIntegrationService,
  ImageLibraryService,
  OdooIntegrationService
} from '../services/index.js';
import { AuthenticatedRequest } from '../middleware/identity.js';

export class IntegrationController {
  private connSvc = new IntegrationConnectionService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider, accessToken, refreshToken, expiresAt, tokenType, scope, accountId, accountName } = req.body;
      if (!provider || !accessToken) return res.status(400).json({ success: false, message: 'Provider and accessToken required' });

      const connection = await this.connSvc.connect(
        { provider, accessToken, refreshToken, expiresAt, tokenType, scope, accountId, accountName },
        req.identity.userId,
        req.identity.orgId
      );
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnections(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider } = req.query;
      const connections = await this.connSvc.getConnections(req.identity.orgId, provider as string);
      return res.json({ success: true, data: connections });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async disconnect(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider } = req.body;
      if (!provider) return res.status(400).json({ success: false, message: 'Provider is required' });

      await this.connSvc.disconnect(req.identity.userId, provider);
      return res.json({ success: true, message: 'Disconnected' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class GoogleController {
  private svc = new GoogleIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, refreshToken, expiresAt } = req.body;
      const integration = await this.svc.connect(req.identity.userId, req.identity.orgId, { accessToken, refreshToken, expiresAt, isConnected: true });
      return res.status(201).json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getConnection(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getReviews(req: AuthenticatedRequest, res: Response) {
    const reviews = await this.svc.getReviews(req.identity.userId);
    return res.json({ success: true, data: reviews });
  }

  async getSecret(req: AuthenticatedRequest, res: Response) {
    const secret = await this.svc.getSecret(req.identity.userId);
    return res.json({ success: true, data: secret });
  }
}

export class ZoomController {
  private svc = new ZoomIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, refreshToken, expiresAt, accountId } = req.body;
      const integration = await this.svc.connect(req.identity.userId, req.identity.orgId, { accessToken, refreshToken, expiresAt, accountId, isConnected: true });
      return res.status(201).json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getConnection(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { topic, startTime, duration, joinUrl, password } = req.body;
      if (!topic || !startTime) return res.status(400).json({ success: false, message: 'Topic and startTime required' });

      const meeting = await this.svc.createMeeting(
        { zoomId: '', topic, startTime: new Date(startTime), duration, joinUrl, password },
        req.identity.userId,
        req.identity.orgId
      );
      return res.status(201).json({ success: true, data: meeting });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMeetings(req: AuthenticatedRequest, res: Response) {
    try {
      const meetings = await this.svc.getMeetings(req.identity.userId);
      return res.json({ success: true, data: meetings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId, ...data } = req.body;
      const meeting = await this.svc.updateMeeting(meetingId, data);
      return res.json({ success: true, data: meeting });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const meetingId = getRouteParam(req.params.meetingId);
      await this.svc.deleteMeeting(meetingId);
      return res.json({ success: true, message: 'Meeting deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    const user = await this.svc.getCurrentUser('');
    return res.json({ success: true, data: user });
  }

  async generateSignature(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId, role } = req.body;
      const signature = await this.svc.generateSignature(meetingId, role);
      return res.json({ success: true, data: signature });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async isProfileExists(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: { exists: false } });
  }

  async getCredentials(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: {} });
  }
}

export class FacebookController {
  private svc = new FacebookIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, pageId, pageName } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, pageId, pageName);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPages(req: AuthenticatedRequest, res: Response) {
    const pages = await this.svc.getPages(req.identity.userId);
    return res.json({ success: true, data: pages });
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { message, mediaUrls } = req.body;
      const post = await this.svc.createPost(req.identity.userId, message, mediaUrls);
      return res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCampaignsInsights(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: {} });
  }
}

export class InstagramController {
  private svc = new InstagramIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, accountId } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, accountId);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { imageUrl, caption } = req.body;
      const post = await this.svc.createPost(req.identity.userId, imageUrl, caption);
      return res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getInsights(req: AuthenticatedRequest, res: Response) {
    const insights = await this.svc.getInsights(req.identity.userId);
    return res.json({ success: true, data: insights });
  }
}

export class LinkedInController {
  private svc = new LinkedInIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, companyId } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, companyId);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, mediaUrl } = req.body;
      const post = await this.svc.createPost(req.identity.userId, text, mediaUrl);
      return res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class TikTokController {
  private svc = new TikTokIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, openId } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, openId);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createVideo(req: AuthenticatedRequest, res: Response) {
    try {
      const { videoUrl, description } = req.body;
      const video = await this.svc.createVideo(req.identity.userId, videoUrl, description);
      return res.status(201).json({ success: true, data: video });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class ShopifyController {
  private svc = new ShopifyIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { shopDomain, accessToken } = req.body;
      if (!shopDomain || !accessToken) return res.status(400).json({ success: false, message: 'shopDomain and accessToken required' });

      const store = await this.svc.connect(req.identity.userId, req.identity.orgId, { shopDomain, isActive: true }, accessToken);
      return res.status(201).json({ success: true, data: store });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStores(req: AuthenticatedRequest, res: Response) {
    try {
      const stores = await this.svc.getStores(req.identity.userId);
      return res.json({ success: true, data: stores });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const { storeId } = req.query;
      const products = await this.svc.getProducts(storeId as string);
      return res.json({ success: true, data: products });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class MagentoController {
  private svc = new MagentoIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { baseUrl, accessToken, username, password, storeCode } = req.body;
      if (!baseUrl) {
        return res.status(400).json({ success: false, message: "baseUrl is required" });
      }

      const connection = await this.svc.connect(req.identity, {
        baseUrl,
        accessToken,
        username,
        password,
        storeCode,
        isActive: true,
      });
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const connection = await this.svc.getConnection(req.identity.userId);
      return res.json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async disconnect(req: AuthenticatedRequest, res: Response) {
    try {
      await this.svc.disconnect(req.identity);
      return res.json({ success: true, message: "Magento disconnected" });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStores(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getStores(req.identity);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const pageSize = Number(req.query.pageSize || 50);
      const currentPage = Number(req.query.currentPage || 1);
      const search = String(req.query.search || "");
      const data = await this.svc.getProducts(req.identity, pageSize, currentPage, search);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const pageSize = Number(req.query.pageSize || 50);
      const currentPage = Number(req.query.currentPage || 1);
      const data = await this.svc.getOrders(req.identity, pageSize, currentPage);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const pageSize = Number(req.query.pageSize || 50);
      const currentPage = Number(req.query.currentPage || 1);
      const data = await this.svc.getCustomers(req.identity, pageSize, currentPage);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class UberEatsController {
  private svc = new UberEatsIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { storeId, accessToken, refreshToken } = req.body;
      const config = await this.svc.connect(req.identity.userId, req.identity.orgId, { storeId, accessToken, refreshToken, isActive: true });
      return res.status(201).json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const orders = await this.svc.getOrders(req.identity.userId);
      return res.json({ success: true, data: orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class EasyPostController {
  private svc = new EasyPostIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ success: false, message: 'apiKey required' });

      const config = await this.svc.connect(req.identity.userId, req.identity.orgId, apiKey);
      return res.status(201).json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createShipment(req: AuthenticatedRequest, res: Response) {
    try {
      const shipment = await this.svc.createShipment(req.identity.userId, req.body);
      return res.status(201).json({ success: true, data: shipment });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRates(req: AuthenticatedRequest, res: Response) {
    try {
      const rates = await this.svc.getRates(req.identity.userId, req.body);
      return res.json({ success: true, data: rates });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class UserIntegrationSettingsController {
  private svc = new UserIntegrationSettingsService();

  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await this.svc.getSettings(req.identity.userId);
      return res.json({ success: true, data: settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await this.svc.updateSettings(req.identity.userId, req.body);
      return res.json({ success: true, data: settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class MetaIntegrationController {
  private svc = new MetaIntegrationService();

  async getIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getIntegration(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.updateIntegration(req.identity.userId, req.identity.orgId, req.body);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class WhatsAppController {
  private svc = new WhatsAppService();

  async getInstances(req: AuthenticatedRequest, res: Response) {
    try {
      const instances = await this.svc.getInstances(req.identity.userId);
      return res.json({ success: true, data: instances });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createInstance(req: AuthenticatedRequest, res: Response) {
    try {
      const { name } = req.body;
      const instance = await this.svc.createInstance(req.identity.userId, req.identity.orgId, name);
      return res.status(201).json({ success: true, data: instance });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteInstance(req: AuthenticatedRequest, res: Response) {
    try {
      const instanceId = getRouteParam(req.params.instanceId);
      await this.svc.deleteInstance(instanceId);
      return res.json({ success: true, message: 'Instance deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getQr(req: AuthenticatedRequest, res: Response) {
    try {
      const instanceId = getRouteParam(req.params.instanceId);
      const instance = await this.svc.getInstance(instanceId);
      if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
      return res.json({ success: true, data: { qr: instance.qr, status: instance.status } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const instanceId = getRouteParam(req.params.instanceId);
      const instance = await this.svc.getInstance(instanceId);
      if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
      return res.json({
        success: true,
        data: {
          instanceId: instance.instanceId,
          status: instance.status,
          phone: instance.phone,
          updatedAt: instance.updatedAt,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class TelegramController {
  private svc = new TelegramService();

  async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const sessions = await this.svc.getSessions(req.identity.userId);
      return res.json({ success: true, data: sessions });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { name } = req.body;
      const session = await this.svc.createSession(req.identity.userId, req.identity.orgId, name);
      return res.status(201).json({ success: true, data: session });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteSession(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = getRouteParam(req.params.sessionId);
      await this.svc.deleteSession(sessionId);
      return res.json({ success: true, message: 'Session deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const phone = String(req.body?.phone || req.body?.mobile || '').trim();
      if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });
      const data = await this.svc.sendOtp(req.identity.userId, req.identity.orgId, phone);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async verifyOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const phone = String(req.body?.phone || req.body?.mobile || '').trim();
      const otp = String(req.body?.otp || req.body?.code || '').trim();
      if (!phone || !otp) return res.status(400).json({ success: false, message: 'phone and otp are required' });
      const data = await this.svc.verifyOtp(req.identity.orgId, phone, otp);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

export class VoiceIntegrationController {
  private svc = new VoiceIntegrationService();

  async getIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getIntegration(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.updateIntegration(req.identity.userId, req.identity.orgId, req.body);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

import { WebhookService } from '../services/index.js';

export class WebhookController {
  private svc = new WebhookService();

  async verifyMeta(req: any, res: Response) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      const result = await this.svc.verifyMetaWebhook(mode, token, challenge);
      return res.send(result);
    } catch (err: any) {
      return res.status(403).send('Forbidden');
    }
  }

  async handleMeta(req: any, res: Response) {
    try {
      await this.svc.handleMetaWebhook(req.body, req.logger);
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err: any) {
      return res.status(200).send('EVENT_RECEIVED'); // Meta expects 200 even on error to stop retries
    }
  }

  async handleTelegram(req: any, res: Response) {
    try {
      await this.svc.handleTelegramWebhook(req.body, req.logger, req.params?.sessionId);
      return res.json({ success: true });
    } catch (err: any) {
      return res.json({ success: true });
    }
  }
}

export class OdooController {
  private svc = new OdooIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { baseUrl, db, username, password, apiKey, isActive } = req.body;
      if (!baseUrl || !db || !username) {
        return res.status(400).json({ success: false, message: 'baseUrl, db, and username are required' });
      }

      const input = {
        baseUrl: String(baseUrl),
        db: String(db),
        username: String(username),
        ...(password !== undefined && { password: String(password) }),
        ...(apiKey !== undefined && { apiKey: String(apiKey) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      };

      const connection = await this.svc.connect(req.identity, input);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const connection = await this.svc.getConnection(req.identity.userId);
      return res.json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async disconnect(req: AuthenticatedRequest, res: Response) {
    try {
      await this.svc.disconnect(req.identity);
      return res.json({ success: true, message: 'Odoo disconnected' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getContacts(req: AuthenticatedRequest, res: Response) {
    try {
      const page = Number(req.query.page || 1);
      const pageSize = Number(req.query.pageSize || 50);
      const search = String(req.query.search || '');
      const data = await this.svc.getContacts(req.identity, page, pageSize, search);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getInvoices(req: AuthenticatedRequest, res: Response) {
    try {
      const page = Number(req.query.page || 1);
      const pageSize = Number(req.query.pageSize || 50);
      const data = await this.svc.getInvoices(req.identity, page, pageSize);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async syncMagento(req: AuthenticatedRequest, res: Response) {
    try {
      const { dryRun, limit, push } = req.body;
      const options = {
        ...(dryRun !== undefined && { dryRun: Boolean(dryRun) }),
        ...(limit !== undefined && { limit: Number(limit) }),
        ...(push !== undefined && { push: Boolean(push) }),
      };
      const data = await this.svc.syncMagento(req.identity, options);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class ImageLibraryController {
  private svc = new ImageLibraryService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const category = req.query.category ? String(req.query.category) : undefined;
      const limit = Number(req.query.limit || 200);
      const data = await this.svc.list(req.identity.orgId, category, limit);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, url, thumbnail, mimeType, size, category, tags } = req.body;

      if (!name || !url) {
        return res.status(400).json({ success: false, message: 'Image name and url are required' });
      }

      const payload = {
        name: String(name),
        url: String(url),
        thumbnail: thumbnail ? String(thumbnail) : undefined,
        mimeType: mimeType ? String(mimeType) : undefined,
        size: size ? Number(size) : undefined,
        category: category ? String(category) : undefined,
        tags: Array.isArray(tags) ? tags.map(String) : undefined,
      };

      const data = await this.svc.create(req.identity.userId, req.identity.orgId, payload);
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getRouteParam(req.params.id);
      const data = await this.svc.remove(req.identity.orgId, id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}
