import { 
  IntegrationConnectionRepository,
  GoogleIntegrationRepository,
  ZoomIntegrationRepository,
  ZoomMeetingRepository,
  ShopifyStoreRepository,
  UberEatsConfigRepository,
  EasyPostConfigRepository,
  IntegrationActivityRepository,
  UserIntegrationSettingsRepository,
  MetaIntegrationRepository,
  VoiceIntegrationRepository,
  WhatsAppInstanceRepository,
  TelegramSessionRepository
  ,
  ImageAssetRepository
} from '../repositories/index.js';
import type { 
  IntegrationConnectionInput, 
  GoogleIntegrationInput, 
  ZoomIntegrationInput,
  ZoomMeetingInput,
  ShopifyStoreInput,
  MagentoIntegrationInput,
  UberEatsConfigInput,
  EasyPostConfigInput,
  UserIntegrationSettingsInput,
  MetaIntegrationInput,
  VoiceIntegrationInput,
  WhatsAppInstanceInput,
  TelegramSessionInput,
  OmniMessageReceivedEvent,
  OdooIntegrationInput
  ,
  ImageAssetInput
} from '../types/index.js';
import { config } from '../config/index.js';

export class IntegrationConnectionService {
  private repo = new IntegrationConnectionRepository();

  async connect(data: IntegrationConnectionInput, userId: string, organizationId?: string) {
    const connection = await this.repo.create({ ...data, userId, organizationId });
    await this.logActivity(userId, organizationId, data.provider, 'connect', 'success');
    return connection;
  }

  async getConnections(organizationId: string, provider?: string) {
    return this.repo.findByOrganizationId(organizationId, provider);
  }

  async getConnection(userId: string, provider: string) {
    return this.repo.findByUserAndProvider(userId, provider);
  }

  async disconnect(userId: string, provider: string) {
    await this.repo.delete(userId, provider);
    await this.logActivity(userId, undefined, provider, 'disconnect', 'success');
    return { success: true };
  }

  async updateToken(userId: string, provider: string, accessToken: string, refreshToken?: string, expiresAt?: Date) {
    const connection = await this.repo.findByUserAndProvider(userId, provider);
    if (!connection) throw new Error('Connection not found');
    return this.repo.update(connection.id, { accessToken, refreshToken, expiresAt });
  }

  private async logActivity(userId: string, organizationId: string | undefined, provider: string, action: string, status: string) {
    const activityRepo = new IntegrationActivityRepository();
    await activityRepo.create({ userId, organizationId, provider, action, status });
  }
}

export class GoogleIntegrationService {
  private repo = new GoogleIntegrationRepository();
  private connRepo = new IntegrationConnectionRepository();

  async connect(userId: string, organizationId: string | undefined, data: GoogleIntegrationInput) {
    const integration = await this.repo.upsert(userId, organizationId, { ...data, isConnected: true });
    await this.connRepo.create({
      userId,
      organizationId,
      provider: 'google',
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt
    });
    return integration;
  }

  async disconnect(userId: string) {
    await this.repo.disconnect(userId);
    await this.connRepo.delete(userId, 'google');
    return { success: true };
  }

  async getConnection(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async getReviews(userId: string) {
    return { reviews: [] };
  }

  async getSecret(userId: string) {
    return { clientId: '', clientSecret: '' };
  }
}

export class ZoomIntegrationService {
  private repo = new ZoomIntegrationRepository();
  private meetingRepo = new ZoomMeetingRepository();
  private connRepo = new IntegrationConnectionRepository();

  async connect(userId: string, organizationId: string | undefined, data: ZoomIntegrationInput) {
    const integration = await this.repo.upsert(userId, organizationId, { ...data, isConnected: true });
    await this.connRepo.create({
      userId,
      organizationId,
      provider: 'zoom',
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      accountId: data.accountId
    });
    return integration;
  }

  async disconnect(userId: string) {
    await this.repo.disconnect(userId);
    await this.connRepo.delete(userId, 'zoom');
    return { success: true };
  }

  async getConnection(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async createMeeting(data: ZoomMeetingInput, userId: string, organizationId?: string) {
    return this.meetingRepo.create({ ...data, userId, organizationId });
  }

  async getMeetings(userId: string) {
    return this.meetingRepo.findByUserId(userId);
  }

  async updateMeeting(id: string, data: Partial<ZoomMeetingInput>) {
    return this.meetingRepo.update(id, data);
  }

  async deleteMeeting(id: string) {
    return this.meetingRepo.delete(id);
  }

  async getCurrentUser(accessToken: string) {
    return { id: '', email: '', name: '' };
  }

  async generateSignature(meetingId: string, role: number) {
    return { signature: '' };
  }
}

export class FacebookIntegrationService {
  private connRepo = new IntegrationConnectionRepository();

  async connect(userId: string, organizationId: string | undefined, accessToken: string, pageId?: string, pageName?: string) {
    return this.connRepo.create({
      userId,
      organizationId,
      provider: 'facebook',
      accessToken,
      accountId: pageId,
      accountName: pageName
    });
  }

  async disconnect(userId: string) {
    return this.connRepo.delete(userId, 'facebook');
  }

  async getPages(userId: string) {
    return { pages: [] };
  }

  async createPost(userId: string, message: string, mediaUrls?: string[]) {
    return { postId: '', success: true };
  }

  async getInsights(userId: string, campaignId: string) {
    return { impressions: 0, clicks: 0, spend: 0 };
  }
}

export class InstagramIntegrationService {
  private connRepo = new IntegrationConnectionRepository();

  async connect(userId: string, organizationId: string | undefined, accessToken: string, accountId?: string) {
    return this.connRepo.create({
      userId,
      organizationId,
      provider: 'instagram',
      accessToken,
      accountId
    });
  }

  async disconnect(userId: string) {
    return this.connRepo.delete(userId, 'instagram');
  }

  async createPost(userId: string, imageUrl: string, caption: string) {
    return { mediaId: '', success: true };
  }

  async getInsights(userId: string) {
    return { followers: 0, engagement: 0 };
  }
}

export class LinkedInIntegrationService {
  private connRepo = new IntegrationConnectionRepository();

  async connect(userId: string, organizationId: string | undefined, accessToken: string, companyId?: string) {
    return this.connRepo.create({
      userId,
      organizationId,
      provider: 'linkedin',
      accessToken,
      accountId: companyId
    });
  }

  async disconnect(userId: string) {
    return this.connRepo.delete(userId, 'linkedin');
  }

  async createPost(userId: string, text: string, mediaUrl?: string) {
    return { postId: '', success: true };
  }
}

export class TikTokIntegrationService {
  private connRepo = new IntegrationConnectionRepository();

  async connect(userId: string, organizationId: string | undefined, accessToken: string, openId?: string) {
    return this.connRepo.create({
      userId,
      organizationId,
      provider: 'tiktok',
      accessToken,
      accountId: openId
    });
  }

  async disconnect(userId: string) {
    return this.connRepo.delete(userId, 'tiktok');
  }

  async createVideo(userId: string, videoUrl: string, description: string) {
    return { videoId: '', success: true };
  }
}

export class ShopifyIntegrationService {
  private repo = new ShopifyStoreRepository();
  private connRepo = new IntegrationConnectionRepository();

  async connect(userId: string, organizationId: string | undefined, data: ShopifyStoreInput, accessToken: string) {
    const store = await this.repo.create({ ...data, userId, organizationId, accessToken });
    await this.connRepo.create({
      userId,
      organizationId,
      provider: 'shopify',
      accessToken,
      accountId: data.shopDomain
    });
    return store;
  }

  async disconnect(userId: string) {
    await this.repo.deactivateManyByUserId(userId);
    await this.connRepo.delete(userId, 'shopify');
    return { success: true };
  }

  async getStores(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async getProducts(storeId: string) {
    return { products: [] };
  }

  async createOrder(storeId: string, orderData: any) {
    return { orderId: '', success: true };
  }
}

import type { Identity } from '../middleware/identity.js';

export class MagentoIntegrationService {
  private connRepo = new IntegrationConnectionRepository();

  private async request(identity: Identity, path: string, method = 'GET', body?: any, query?: any) {
    if (!config.magentoServiceUrl) {
      throw new Error('Magento integration is disabled. Set MAGENTO_INTEGRATION_SERVICE_URL to enable it.');
    }
    const url = new URL(`${config.magentoServiceUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }

    const res = await fetch(url.toString(), {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': identity.userId,
        'X-Org-Id': identity.orgId || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Magento Service error: ${error.message || res.statusText}`);
    }
    return res.json();
  }

  async connect(identity: Identity, data: MagentoIntegrationInput) {
    const result = await this.request(identity, '/v1/magento/connect', 'POST', data);
    const connection = await this.connRepo.upsertByUserProvider(identity.userId, 'magento', {
      organizationId: identity.orgId,
      accessToken: result.data?.accessToken,
      accountId: data.baseUrl,
      accountName: `Magento (${data.storeCode || 'default'})`,
      metadata: { baseUrl: data.baseUrl, storeCode: data.storeCode },
      isActive: true,
    });
    return connection;
  }

  async getConnection(userId: string) {
    return this.connRepo.findByUserAndProvider(userId, 'magento');
  }

  async disconnect(identity: Identity) {
    await this.request(identity, '/v1/magento/disconnect', 'POST');
    return this.connRepo.deactivate(identity.userId, 'magento');
  }

  async getStores(identity: Identity) {
    return this.request(identity, '/v1/magento/stores');
  }

  async getProducts(identity: Identity, pageSize = 50, currentPage = 1, search = '') {
    return this.request(identity, '/v1/magento/products', 'GET', undefined, { pageSize, currentPage, search });
  }

  async getOrders(identity: Identity, pageSize = 50, currentPage = 1) {
    return this.request(identity, '/v1/magento/orders', 'GET', undefined, { pageSize, currentPage });
  }

  async getCustomers(identity: Identity, pageSize = 50, currentPage = 1) {
    return this.request(identity, '/v1/magento/customers', 'GET', undefined, { pageSize, currentPage });
  }
}

export class OdooIntegrationService {
  private connRepo = new IntegrationConnectionRepository();

  private async request(identity: Identity, path: string, method = 'GET', body?: any, query?: any) {
    if (!config.odooServiceUrl) {
      throw new Error('Odoo integration is disabled. Set ODOO_INTEGRATION_SERVICE_URL to enable it.');
    }

    const url = new URL(`${config.odooServiceUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }

    const res = await fetch(url.toString(), {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': identity.userId,
        'X-Org-Id': identity.orgId || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Odoo Service error: ${error.message || res.statusText}`);
    }
    return res.json();
  }

  async connect(identity: Identity, data: OdooIntegrationInput) {
    const result = await this.request(identity, '/v1/odoo/connect', 'POST', data);
    const connection = await this.connRepo.upsertByUserProvider(identity.userId, 'odoo', {
      organizationId: identity.orgId,
      accessToken: data.apiKey || data.password,
      accountId: data.baseUrl,
      accountName: `Odoo (${data.db})`,
      metadata: { baseUrl: data.baseUrl, db: data.db, username: data.username },
      isActive: true,
    });
    return connection;
  }

  async getConnection(userId: string) {
    return this.connRepo.findByUserAndProvider(userId, 'odoo');
  }

  async disconnect(identity: Identity) {
    await this.request(identity, '/v1/odoo/disconnect', 'POST');
    return this.connRepo.deactivate(identity.userId, 'odoo');
  }

  async getContacts(identity: Identity, page = 1, pageSize = 50, search = '') {
    return this.request(identity, '/v1/odoo/contacts', 'GET', undefined, { page, pageSize, search });
  }

  async getInvoices(identity: Identity, page = 1, pageSize = 50) {
    return this.request(identity, '/v1/odoo/invoices', 'GET', undefined, { page, pageSize });
  }

  async syncMagento(identity: Identity, options: { dryRun?: boolean; limit?: number; push?: boolean }) {
    return this.request(identity, '/v1/odoo/sync/magento/all', 'POST', options);
  }
}

export class UberEatsIntegrationService {
  private repo = new UberEatsConfigRepository();

  async connect(userId: string, organizationId: string | undefined, data: UberEatsConfigInput) {
    return this.repo.upsert(userId, organizationId, { ...data, isActive: true });
  }

  async disconnect(userId: string) {
    return this.repo.upsert(userId, undefined, { isActive: false });
  }

  async getConfig(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async getOrders(userId: string) {
    return { orders: [] };
  }
}

export class EasyPostIntegrationService {
  private repo = new EasyPostConfigRepository();

  async connect(userId: string, organizationId: string | undefined, apiKey: string) {
    return this.repo.upsert(userId, organizationId, { apiKey, isActive: true });
  }

  async disconnect(userId: string) {
    return this.repo.upsert(userId, undefined, { isActive: false });
  }

  async getConfig(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async createShipment(userId: string, shipmentData: any) {
    return { shipmentId: '', trackingCode: '', labelUrl: '' };
  }

  async getRates(userId: string, parcelData: any) {
    return { rates: [] };
  }
}

export class UserIntegrationSettingsService {
  private repo = new UserIntegrationSettingsRepository();

  async getSettings(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async updateSettings(userId: string, data: UserIntegrationSettingsInput) {
    return this.repo.upsert(userId, data);
  }

  async validateApiKey(apiKey: string) {
    return this.repo.findByApiKey(apiKey);
  }
}

export class MetaIntegrationService {
  private repo = new MetaIntegrationRepository();

  async getIntegration(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async updateIntegration(userId: string, organizationId: string | undefined, data: MetaIntegrationInput) {
    return this.repo.upsert(userId, organizationId, data);
  }

  async getOrganizationIntegrations(organizationId: string) {
    return this.repo.findByOrganizationId(organizationId);
  }

  async findByBusinessPhoneNumberId(businessPhoneNumberId: string) {
    return this.repo.findByBusinessPhoneNumberId(businessPhoneNumberId);
  }
}

export class VoiceIntegrationService {
  private repo = new VoiceIntegrationRepository();

  async getIntegration(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async updateIntegration(userId: string, organizationId: string | undefined, data: VoiceIntegrationInput) {
    return this.repo.upsert(userId, organizationId, data);
  }

  async getOrganizationIntegrations(organizationId: string) {
    return this.repo.findByOrganizationId(organizationId);
  }
}

import { emitOmniMessageReceived } from '../kafka/omni.producer.js';

export class WebhookService {
  private metaIntegrationService = new MetaIntegrationService();
  private telegramService = new TelegramService();

  async verifyMetaWebhook(mode: string, token: string, challenge: string) {
    if (mode === 'subscribe' && token === config.metaWebhookVerifyToken) {
      return challenge;
    }
    throw new Error('Verification failed');
  }

  async handleMetaWebhook(body: any, logger: any) {
    // Basic WhatsApp message extraction logic based on WACRM parity
    if (body.object === 'whatsapp_business_account') {
      const orgCache = new Map<string, string | null | undefined>();

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              const contact = change.value.contacts?.[0];
              const businessPhoneNumberId = change.value.metadata?.phone_number_id;

              let organizationId: string | null | undefined;

              if (businessPhoneNumberId) {
                if (orgCache.has(businessPhoneNumberId)) {
                  organizationId = orgCache.get(businessPhoneNumberId);
                } else {
                  const integration = await this.metaIntegrationService.findByBusinessPhoneNumberId(businessPhoneNumberId);
                  organizationId = integration?.organizationId;
                  orgCache.set(businessPhoneNumberId, organizationId);
                }
              }

              if (!organizationId) {
                logger.warn?.(
                  { businessPhoneNumberId, messageId: message.id },
                  "Skipping WhatsApp webhook event because organization could not be resolved"
                );
                continue;
              }

              const event: OmniMessageReceivedEvent = {
                provider: 'whatsapp',
                instanceId: businessPhoneNumberId,
                contactMobile: message.from,
                contactName: contact?.profile?.name,
                content: message.text?.body || '',
                type: message.type,
                timestamp: parseInt(message.timestamp),
                organizationId,
                metadata: {
                  messageId: message.id,
                  raw: body
                }
              };

              await emitOmniMessageReceived(event, logger);
            }
          }
        }
      }
    }
    return { success: true };
  }

  async handleTelegramWebhook(body: any, logger: any, sessionId?: string) {
    if (body.message) {
      const session = sessionId
        ? await this.telegramService.getSessionById(sessionId)
        : null;
      const organizationId = session?.organizationId;

      if (!organizationId) {
        logger.warn?.(
          { sessionId, messageId: body.message.message_id },
          "Skipping Telegram webhook event because organization could not be resolved"
        );
        return { success: false, skipped: true };
      }

      const event: OmniMessageReceivedEvent = {
        provider: 'telegram',
        instanceId: session?.sessionId || sessionId || 'telegram-session',
        contactMobile: body.message.from.id.toString(),
        contactName: `${body.message.from.first_name || ''} ${body.message.from.last_name || ''}`.trim(),
        content: body.message.text || '',
        type: 'text',
        timestamp: body.message.date,
        organizationId,
        metadata: {
          messageId: body.message.message_id.toString(),
          raw: body
        }
      };
      await emitOmniMessageReceived(event, logger);
    }
    return { success: true };
  }
}

export class WhatsAppService {
  private repo = new WhatsAppInstanceRepository();

  async getInstances(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async getInstance(instanceId: string) {
    return this.repo.findByInstanceId(instanceId);
  }

  async createInstance(userId: string, organizationId: string | undefined, name?: string) {
    const instanceId = `wa_${Math.random().toString(36).substring(2, 15)}`;
    return this.repo.create({ userId, organizationId, name, instanceId, status: 'initial' });
  }

  async updateStatus(instanceId: string, status: string, qr?: string, phone?: string) {
    return this.repo.update(instanceId, { status, qr, phone });
  }

  async deleteInstance(instanceId: string) {
    return this.repo.delete(instanceId);
  }
}

export class TelegramService {
  private repo = new TelegramSessionRepository();
  private static otpStore = new Map<string, { otp: string; expiresAt: number }>();

  async getSessions(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async getSessionById(sessionId: string) {
    return this.repo.findBySessionId(sessionId);
  }

  async createSession(userId: string, organizationId: string | undefined, name?: string) {
    const sessionId = `tg_${Math.random().toString(36).substring(2, 15)}`;
    return this.repo.create({ userId, organizationId, name, sessionId, status: 'disconnected' });
  }

  async updateStatus(sessionId: string, status: string, phone?: string) {
    return this.repo.update(sessionId, { status, phone });
  }

  async deleteSession(sessionId: string) {
    return this.repo.delete(sessionId);
  }

  async sendOtp(userId: string, organizationId: string | undefined, phone: string) {
    const normalizedPhone = String(phone || '').trim();
    if (!normalizedPhone) throw new Error('phone is required');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const key = `${organizationId || 'global'}:${normalizedPhone}`;
    TelegramService.otpStore.set(key, { otp, expiresAt });

    // Ensure there is at least one session for this user/org.
    const existing = (await this.getSessions(userId)).find((session) => session.organizationId === organizationId);
    if (!existing) {
      await this.createSession(userId, organizationId, `Telegram ${normalizedPhone}`);
    }

    return {
      sent: true,
      expiresInSeconds: 300,
      // Dev-only compatibility field.
      otp,
    };
  }

  async verifyOtp(organizationId: string | undefined, phone: string, otp: string) {
    const normalizedPhone = String(phone || '').trim();
    const code = String(otp || '').trim();
    if (!normalizedPhone || !code) throw new Error('phone and otp are required');
    const key = `${organizationId || 'global'}:${normalizedPhone}`;
    const record = TelegramService.otpStore.get(key);
    if (!record) return { verified: false, reason: 'OTP not found' };
    if (record.expiresAt < Date.now()) {
      TelegramService.otpStore.delete(key);
      return { verified: false, reason: 'OTP expired' };
    }
    if (record.otp !== code) return { verified: false, reason: 'Invalid OTP' };
    TelegramService.otpStore.delete(key);
    return { verified: true };
  }
}

export class ImageLibraryService {
  private repo = new ImageAssetRepository();

  async list(organizationId: string, category?: string, limit = 200) {
    return this.repo.listByOrg(organizationId, category, limit);
  }

  async create(userId: string, organizationId: string, data: ImageAssetInput) {
    if (!data?.name?.trim()) throw new Error('Image name is required');
    if (!data?.url?.trim()) throw new Error('Image url is required');
    if (!String(data.url).startsWith('data:image/')) {
      throw new Error('Only image data URLs are supported');
    }

    return this.repo.create({
      userId,
      organizationId,
      name: data.name.trim(),
      url: data.url.trim(),
      thumbnail: data.thumbnail?.trim() || data.url.trim(),
      mimeType: data.mimeType?.trim(),
      size: data.size,
      category: data.category?.trim() || 'commerce-product',
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 20) : [],
    });
  }

  async remove(organizationId: string, id: string) {
    if (!id) throw new Error('Image id is required');
    const result = await this.repo.deleteById(id, organizationId);
    return { deleted: result.count > 0 };
  }
}
