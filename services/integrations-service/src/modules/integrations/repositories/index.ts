import { db } from '../db.js';
import type { 
  IntegrationConnectionInput, 
  GoogleIntegrationInput, 
  ZoomIntegrationInput,
  ZoomMeetingInput,
  ShopifyStoreInput,
  UberEatsConfigInput,
  EasyPostConfigInput,
  IntegrationActivityInput,
  UserIntegrationSettingsInput,
  MetaIntegrationInput,
  VoiceIntegrationInput,
  WhatsAppInstanceInput,
  TelegramSessionInput,
  ImageAssetInput
} from '../types/index.js';
import { encryptToken, decryptToken } from '@mymanager/node-service-kit';

function encryptIfPresent(val: string | null | undefined): string | null | undefined {
  if (!val) return val;
  try {
    return encryptToken(val);
  } catch (err) {
    console.error('Encryption failed', err);
    return val;
  }
}

function decryptIfPresent(val: string | null | undefined): string | null | undefined {
  if (!val) return val;
  if (!val.includes(':')) return val; // Heuristic for already encrypted
  try {
    return decryptToken(val);
  } catch (err) {
    return val; // Fallback to plaintext
  }
}

function decryptConnection(conn: any) {
  if (!conn) return conn;
  return {
    ...conn,
    accessToken: decryptIfPresent(conn.accessToken),
    refreshToken: decryptIfPresent(conn.refreshToken),
  };
}

export class IntegrationConnectionRepository {
  async create(data: IntegrationConnectionInput & { userId: string; organizationId?: string }) {
    const encryptedData = {
      ...data,
      accessToken: encryptIfPresent(data.accessToken),
      refreshToken: encryptIfPresent(data.refreshToken),
    };
    return db.integrationConnection.create({ data: encryptedData }).then(decryptConnection);
  }

  async findByUserAndProvider(userId: string, provider: string) {
    return db.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider } }
    }).then(decryptConnection);
  }

  async findByOrganizationId(organizationId: string, provider?: string) {
    if (provider) {
      return db.integrationConnection.findMany({
        where: { organizationId, provider, isActive: true }
      }).then((list: any[]) => list.map(decryptConnection));
    }
    return db.integrationConnection.findMany({
      where: { organizationId, isActive: true }
    }).then((list: any[]) => list.map(decryptConnection));
  }

  async update(id: string, data: Partial<IntegrationConnectionInput>) {
    const encryptedData = {
      ...data,
      accessToken: data.accessToken !== undefined ? encryptIfPresent(data.accessToken) : undefined,
      refreshToken: data.refreshToken !== undefined ? encryptIfPresent(data.refreshToken) : undefined,
    };
    return db.integrationConnection.update({ where: { id }, data: encryptedData }).then(decryptConnection);
  }

  async upsertByUserProvider(
    userId: string,
    provider: string,
    data: Partial<IntegrationConnectionInput> & { organizationId?: string; isActive?: boolean }
  ) {
    const existing = await this.findByUserAndProvider(userId, provider);
    if (existing) {
      return db.integrationConnection.update({
        where: { id: existing.id },
        data,
      });
    }
    return db.integrationConnection.create({
      data: {
        userId,
        provider,
        ...data,
      },
    });
  }

  async deactivate(userId: string, provider: string) {
    return db.integrationConnection.updateMany({
      where: { userId, provider },
      data: { isActive: false }
    });
  }

  async delete(userId: string, provider: string) {
    return db.integrationConnection.deleteMany({
      where: { userId, provider }
    });
  }
}

export class GoogleIntegrationRepository {
  async upsert(userId: string, organizationId: string | undefined, data: GoogleIntegrationInput) {
    const encryptedData = {
      ...data,
      accessToken: encryptIfPresent(data.accessToken),
      refreshToken: encryptIfPresent(data.refreshToken),
    };
    const existing = await db.googleIntegration.findFirst({ where: { userId } });
    if (existing) {
      return db.googleIntegration.update({ where: { id: existing.id }, data: encryptedData }).then(this.decrypt);
    }
    return db.googleIntegration.create({ data: { ...encryptedData, userId, organizationId } }).then(this.decrypt);
  }

  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      accessToken: decryptIfPresent(item.accessToken),
      refreshToken: decryptIfPresent(item.refreshToken),
    };
  }

  async findByUserId(userId: string) {
    return db.googleIntegration.findFirst({ where: { userId } }).then(this.decrypt);
  }

  async findByOrganizationId(organizationId: string) {
    return db.googleIntegration.findMany({ where: { organizationId } });
  }

  async disconnect(userId: string) {
    return db.googleIntegration.updateMany({
      where: { userId },
      data: { isConnected: false }
    });
  }
}

export class ZoomIntegrationRepository {
  async upsert(userId: string, organizationId: string | undefined, data: ZoomIntegrationInput) {
    const encryptedData = {
      ...data,
      accessToken: encryptIfPresent(data.accessToken),
      refreshToken: encryptIfPresent(data.refreshToken),
      webhookSecret: encryptIfPresent(data.webhookSecret),
    };
    const existing = await db.zoomIntegration.findFirst({ where: { userId } });
    if (existing) {
      return db.zoomIntegration.update({ where: { id: existing.id }, data: encryptedData }).then(this.decrypt);
    }
    return db.zoomIntegration.create({ data: { ...encryptedData, userId, organizationId } }).then(this.decrypt);
  }

  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      accessToken: decryptIfPresent(item.accessToken),
      refreshToken: decryptIfPresent(item.refreshToken),
      webhookSecret: decryptIfPresent(item.webhookSecret),
    };
  }

  async findByUserId(userId: string) {
    return db.zoomIntegration.findFirst({ where: { userId } }).then(this.decrypt);
  }

  async findByOrganizationId(organizationId: string) {
    return db.zoomIntegration.findMany({ where: { organizationId } }).then((list: any[]) => list.map(this.decrypt));
  }

  async disconnect(userId: string) {
    return db.zoomIntegration.updateMany({
      where: { userId },
      data: { isConnected: false }
    });
  }
}

export class ZoomMeetingRepository {
  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      password: decryptIfPresent(item.password),
    };
  }

  async create(data: ZoomMeetingInput & { userId: string; organizationId?: string }) {
    const encryptedData = {
      ...data,
      password: encryptIfPresent(data.password),
    };
    return db.zoomMeeting.create({ data: encryptedData }).then(this.decrypt);
  }

  async findByZoomId(zoomId: string) {
    return db.zoomMeeting.findUnique({ where: { zoomId } }).then(this.decrypt);
  }

  async findByUserId(userId: string) {
    return db.zoomMeeting.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' }
    }).then((list: any[]) => list.map(this.decrypt));
  }

  async update(id: string, data: Partial<ZoomMeetingInput>) {
    const encryptedData = {
      ...data,
      password: data.password ? encryptIfPresent(data.password) : undefined,
    };
    return db.zoomMeeting.update({ where: { id }, data: encryptedData }).then(this.decrypt);
  }

  async delete(id: string) {
    return db.zoomMeeting.delete({ where: { id } });
  }
}

export class ShopifyStoreRepository {
  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      accessToken: decryptIfPresent(item.accessToken),
    };
  }

  async create(data: ShopifyStoreInput & { userId: string; organizationId?: string }) {
    const encryptedData = {
      ...data,
      accessToken: encryptIfPresent(data.accessToken),
    };
    return db.shopifyStore.create({ data: encryptedData }).then(this.decrypt);
  }

  async findByShopDomain(shopDomain: string) {
    return db.shopifyStore.findUnique({ where: { shopDomain } }).then(this.decrypt);
  }

  async findByUserId(userId: string) {
    return db.shopifyStore.findMany({ where: { userId, isActive: true } }).then((list: any[]) => list.map(this.decrypt));
  }

  async findByOrganizationId(organizationId: string) {
    return db.shopifyStore.findMany({ where: { organizationId, isActive: true } }).then((list: any[]) => list.map(this.decrypt));
  }

  async update(id: string, data: Partial<ShopifyStoreInput>) {
    const encryptedData = {
      ...data,
      accessToken: data.accessToken !== undefined ? encryptIfPresent(data.accessToken) : undefined,
    };
    return db.shopifyStore.update({ where: { id }, data: encryptedData }).then(this.decrypt);
  }

  async deactivate(id: string) {
    return db.shopifyStore.update({ where: { id }, data: { isActive: false } });
  }

  async deactivateManyByUserId(userId: string) {
    return db.shopifyStore.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
  }
}

export class UberEatsConfigRepository {
  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      accessToken: decryptIfPresent(item.accessToken),
      refreshToken: decryptIfPresent(item.refreshToken),
    };
  }

  async upsert(userId: string, organizationId: string | undefined, data: UberEatsConfigInput) {
    const encryptedData = {
      ...data,
      accessToken: encryptIfPresent(data.accessToken),
      refreshToken: encryptIfPresent(data.refreshToken),
    };
    const existing = await db.uberEatsConfig.findFirst({ where: { userId } });
    if (existing) {
      return db.uberEatsConfig.update({ where: { id: existing.id }, data: encryptedData }).then(this.decrypt);
    }
    return db.uberEatsConfig.create({ data: { ...encryptedData, userId, organizationId } }).then(this.decrypt);
  }

  async findByUserId(userId: string) {
    return db.uberEatsConfig.findFirst({ where: { userId, isActive: true } }).then(this.decrypt);
  }

  async findByOrganizationId(organizationId: string) {
    return db.uberEatsConfig.findMany({ where: { organizationId, isActive: true } }).then((list: any[]) => list.map(this.decrypt));
  }
}

export class EasyPostConfigRepository {
  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      apiKey: decryptIfPresent(item.apiKey),
    };
  }

  async upsert(userId: string, organizationId: string | undefined, data: EasyPostConfigInput) {
    const encryptedData = {
      ...data,
      apiKey: encryptIfPresent(data.apiKey),
    };
    const existing = await db.easyPostConfig.findFirst({ where: { userId } });
    if (existing) {
      return db.easyPostConfig.update({ where: { id: existing.id }, data: encryptedData }).then(this.decrypt);
    }
    return db.easyPostConfig.create({ data: { ...encryptedData, userId, organizationId } }).then(this.decrypt);
  }

  async findByUserId(userId: string) {
    return db.easyPostConfig.findFirst({ where: { userId, isActive: true } }).then(this.decrypt);
  }

  async findByOrganizationId(organizationId: string) {
    return db.easyPostConfig.findMany({ where: { organizationId, isActive: true } }).then((list: any[]) => list.map(this.decrypt));
  }
}

export class IntegrationActivityRepository {
  async create(data: IntegrationActivityInput & { userId: string; organizationId?: string }) {
    return db.integrationActivity.create({ data });
  }

  async findByUserId(userId: string, limit = 50) {
    return db.integrationActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async findByProvider(provider: string, limit = 50) {
    return db.integrationActivity.findMany({
      where: { provider },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

export class UserIntegrationSettingsRepository {
  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      apiKey: decryptIfPresent(item.apiKey),
    };
  }

  async findByUserId(userId: string) {
    return db.userIntegrationSettings.findUnique({ where: { userId } }).then(this.decrypt);
  }

  async upsert(userId: string, data: UserIntegrationSettingsInput) {
    const encryptedData = {
      ...data,
      apiKey: encryptIfPresent(data.apiKey),
    };
    const existing = await this.findByUserId(userId);
    if (existing) {
      return db.userIntegrationSettings.update({ where: { id: (existing as any).id }, data: encryptedData }).then(this.decrypt);
    }
    return db.userIntegrationSettings.create({ data: { ...encryptedData, userId } }).then(this.decrypt);
  }

  async findByApiKey(apiKey: string) {
    // Note: Searching by encrypted API key is hard. 
    // We might need a hashed version for lookup, but the requirement is encryption.
    // For now, we search by plaintext as fallback, then by encrypted.
    const encryptedKey = encryptIfPresent(apiKey);
    const found = await db.userIntegrationSettings.findFirst({ 
      where: { OR: [{ apiKey }, { apiKey: encryptedKey }] } 
    });
    return this.decrypt(found);
  }
}

export class MetaIntegrationRepository {
  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      accessToken: decryptIfPresent(item.accessToken),
    };
  }

  async findByUserId(userId: string) {
    return db.metaIntegration.findUnique({ where: { userId } }).then(this.decrypt);
  }

  async findByBusinessPhoneNumberId(businessPhoneNumberId: string) {
    return db.metaIntegration.findFirst({
      where: { businessPhoneNumberId }
    }).then(this.decrypt);
  }

  async upsert(userId: string, organizationId: string | undefined, data: MetaIntegrationInput) {
    const encryptedData = {
      ...data,
      accessToken: encryptIfPresent(data.accessToken),
    };
    const existing = await this.findByUserId(userId);
    if (existing) {
      return db.metaIntegration.update({ where: { id: (existing as any).id }, data: encryptedData }).then(this.decrypt);
    }
    return db.metaIntegration.create({ data: { ...encryptedData, userId, organizationId } }).then(this.decrypt);
  }

  async findByOrganizationId(organizationId: string) {
    return db.metaIntegration.findMany({ where: { organizationId } }).then((list: any[]) => list.map(this.decrypt));
  }
}

export class VoiceIntegrationRepository {
  private decrypt(item: any) {
    if (!item) return item;
    return {
      ...item,
      apiKey: decryptIfPresent(item.apiKey),
    };
  }

  async findByUserId(userId: string) {
    return db.voiceIntegration.findUnique({ where: { userId } }).then(this.decrypt);
  }

  async upsert(userId: string, organizationId: string | undefined, data: VoiceIntegrationInput) {
    const encryptedData = {
      ...data,
      apiKey: encryptIfPresent(data.apiKey),
    };
    const existing = await this.findByUserId(userId);
    if (existing) {
      return db.voiceIntegration.update({ where: { id: (existing as any).id }, data: encryptedData }).then(this.decrypt);
    }
    return db.voiceIntegration.create({ data: { ...encryptedData, userId, organizationId } }).then(this.decrypt);
  }

  async findByOrganizationId(organizationId: string) {
    return db.voiceIntegration.findMany({ where: { organizationId } }).then((list: any[]) => list.map(this.decrypt));
  }
}

export class WhatsAppInstanceRepository {
  async create(data: WhatsAppInstanceInput & { userId: string; organizationId?: string }) {
    return db.whatsAppInstance.create({ data });
  }

  async findByInstanceId(instanceId: string) {
    return db.whatsAppInstance.findUnique({ where: { instanceId } });
  }

  async findByUserId(userId: string) {
    return db.whatsAppInstance.findMany({ where: { userId } });
  }

  async findByOrganizationId(organizationId: string) {
    return db.whatsAppInstance.findMany({ where: { organizationId } });
  }

  async update(instanceId: string, data: Partial<WhatsAppInstanceInput>) {
    return db.whatsAppInstance.update({ where: { instanceId }, data });
  }

  async delete(instanceId: string) {
    return db.whatsAppInstance.delete({ where: { instanceId } });
  }
}

export class TelegramSessionRepository {
  async create(data: TelegramSessionInput & { userId: string; organizationId?: string }) {
    return db.telegramSession.create({ data });
  }

  async findBySessionId(sessionId: string) {
    return db.telegramSession.findUnique({ where: { sessionId } });
  }

  async findByUserId(userId: string) {
    return db.telegramSession.findMany({ where: { userId } });
  }

  async findFirstActiveByOrganizationId(organizationId: string) {
    return db.telegramSession.findFirst({
      where: { organizationId, status: { not: 'deleted' } },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findByOrganizationId(organizationId: string) {
    return db.telegramSession.findMany({ where: { organizationId } });
  }

  async update(sessionId: string, data: Partial<TelegramSessionInput>) {
    return db.telegramSession.update({ where: { sessionId }, data });
  }

  async delete(sessionId: string) {
    return db.telegramSession.delete({ where: { sessionId } });
  }
}

export class ImageAssetRepository {
  async create(data: ImageAssetInput & { userId: string; organizationId?: string }) {
    return db.imageAsset.create({
      data: {
        ...data,
        tags: data.tags ?? [],
      },
    });
  }

  async listByOrg(organizationId: string, category?: string, limit = 200) {
    return db.imageAsset.findMany({
      where: {
        organizationId,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }

  async deleteById(id: string, organizationId: string) {
    return db.imageAsset.deleteMany({
      where: { id, organizationId },
    });
  }
}
