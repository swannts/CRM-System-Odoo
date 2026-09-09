export interface ServiceAppOptions {
  serviceName: string;
  loggerLevel?: string;
  jsonLimit?: string;
  urlEncodedLimit?: string;
  enableCors?: boolean;
  enableRateLimit?: boolean;
  rateLimitWindowMs?: number;
  rateLimitMax?: number;
}

export type RequestHandler = (req: any, res: any, next?: any) => any;
export function createServiceApp(options: ServiceAppOptions): { app: any; logger: any };
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: unknown;
}): any;

export function requireIdentityContext(req: any, res: any, next: any, options?: { validateMembership?: boolean }): any;
export function verifyAccessToken(authHeader: string | null | undefined, options?: Record<string, unknown>): Promise<Record<string, any>>;
export const ORG_ROLES: readonly string[];
export const PLATFORM_ROLES: readonly string[];
export function decodeJwtPayload(authHeader: string | null | undefined): Record<string, unknown> | null;
export function extractPlatformRolesFromAuthHeader(authHeader: string | null | undefined, clientId?: string): string[];
export function getHighestPriorityRole(roles?: string[]): string | null;
export function createRoleContextMiddleware(options?: Record<string, unknown>): any;
export function requireOrgRoles(orgRoles?: string[], options?: Record<string, unknown>): any;
export function requirePlatformRoles(platformRoles?: string[]): any;
export function requireAnyRole(options?: Record<string, unknown>): any;
export function fetchResolvedMembership(options: Record<string, unknown>): Promise<Record<string, any> | null>;
export function requireOrganizationMembership(options: Record<string, unknown>): Promise<Record<string, any> | null>;
export function getServiceAccessToken(): Promise<string>;

export function connectAmqpWithRetry(url: string, logger: any, options?: Record<string, unknown>): Promise<any>;
export function ensureTopicExchange(channel: any, exchangeName: string): Promise<void>;
export function publishJson(channel: any, exchangeName: string, routingKey: string, payload: unknown): boolean;
export function createKafkaClient(options: Record<string, unknown>): any;
export function connectKafkaProducerWithRetry(options: Record<string, unknown>, retryOptions?: Record<string, unknown>): Promise<any>;
export function publishJson(producer: any, topic: string, payload: unknown, key?: string): Promise<void>;
export function publishKafkaJson(producer: any, topic: string, payload: unknown, key?: string): Promise<void>;
export function startKafkaConsumer(options: {
  clientId?: string;
  brokers?: string;
  groupId: string;
  topic?: string;
  topics?: string[];
  logger?: any;
  fromBeginning?: boolean;
  onMessage: (message: { topic: string; key: string | null; payload: unknown; headers: Record<string, Buffer | undefined>; partition: number }) => Promise<void>;
}): Promise<any>;
export function encryptToken(plaintext: string | null): string | null;
export function decryptToken(ciphertext: string | null): string | null;
