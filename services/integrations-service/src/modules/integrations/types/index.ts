export interface IntegrationConnectionInput {
  provider: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
  accountId?: string;
  accountName?: string;
  metadata?: any;
}

export interface GoogleIntegrationInput {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  isConnected?: boolean;
}

export interface ZoomIntegrationInput {
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  webhookSecret?: string;
  isConnected?: boolean;
}

export interface ZoomMeetingInput {
  zoomId: string;
  topic: string;
  startTime: Date;
  duration?: number;
  joinUrl?: string;
  password?: string;
  status?: string;
}

export interface ShopifyStoreInput {
  shopDomain: string;
  accessToken?: string;
  scope?: string;
  isActive?: boolean;
}

export interface MagentoIntegrationInput {
  baseUrl: string;
  accessToken?: string;
  username?: string;
  password?: string;
  storeCode?: string;
  isActive?: boolean;
}

export interface UberEatsConfigInput {
  storeId?: string;
  accessToken?: string;
  refreshToken?: string;
  isActive?: boolean;
}

export interface EasyPostConfigInput {
  apiKey?: string;
  isActive?: boolean;
}

export interface IntegrationActivityInput {
  provider: string;
  action: string;
  status?: string;
  details?: any;
}

export interface UserIntegrationSettingsInput {
  timezone?: string;
  apiKey?: string;
  fcmData?: any;
}

export interface MetaIntegrationInput {
  wabaId?: string;
  accessToken?: string;
  businessPhoneNumberId?: string;
  appId?: string;
  loginType?: string;
  embedData?: any;
  isActive?: boolean;
}

export interface VoiceIntegrationInput {
  provider?: string;
  apiKey?: string;
  voiceId?: string;
  settings?: any;
  isActive?: boolean;
}

export interface OdooIntegrationInput {
  baseUrl: string;
  db: string;
  username: string;
  password?: string;
  apiKey?: string;
  isActive?: boolean;
}

export type IntegrationProvider = 
  | 'google' 
  | 'facebook' 
  | 'instagram' 
  | 'linkedin' 
  | 'tiktok' 
  | 'zoom' 
  | 'shopify' 
  | 'magento'
  | 'odoo'
  | 'uber' 
  | 'uber-eats' 
  | 'easypost'
  | 'meta'
  | 'elevenlabs'
  | 'whatsapp'
  | 'telegram';

export interface WhatsAppInstanceInput {
  name?: string;
  instanceId: string;
  status?: string;
  qr?: string;
  phone?: string;
  metadata?: any;
}

export interface TelegramSessionInput {
  name?: string;
  sessionId: string;
  status?: string;
  phone?: string;
  metadata?: any;
}

export interface OmniMessageReceivedEvent {
  provider: 'whatsapp' | 'telegram';
  instanceId: string;
  contactMobile: string;
  contactName?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive';
  timestamp: number;
  metadata?: any;
  organizationId: string;
}

export interface ImageAssetInput {
  name: string;
  url: string;
  thumbnail?: string;
  mimeType?: string;
  size?: number;
  category?: string;
  tags?: string[];
}
