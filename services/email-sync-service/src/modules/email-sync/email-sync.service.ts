import { prisma } from "../../database/prisma/prisma.client.js";
import { decrypt, encrypt } from "../../shared/utils/encryption.js";
import { GoogleAuthService } from "../../integrations/email/google-auth.service.js";
import { OutlookAuthService } from "../../integrations/email/outlook-auth.service.js";

const googleAuth = new GoogleAuthService();
const outlookAuth = new OutlookAuthService();

type Account = {
  id: string;
  orgId: string;
  userId: string;
  email: string;
  provider: string;
  settings?: Record<string, unknown> | null;
  refreshToken: string | null;
  accessToken: string | null;
  expiresAt?: Date | null;
  lastSyncAt: Date | null;
  syncStatus: string;
};

export class EmailSyncService {
  constructor(
    private readonly deps: {
      db?: typeof prisma;
      decryptFn?: typeof decrypt;
      encryptFn?: typeof encrypt;
      gmail?: GoogleAuthService;
      outlook?: OutlookAuthService;
    } = {},
  ) {}

  private isRevokedTokenError(error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return message.includes("invalid_grant") || message.includes("invalid token") || message.includes("token has expired") || message.includes("unauthorized");
  }

  async syncEligibleAccounts() {
    const db = this.deps.db ?? prisma;
    const accounts = await db.emailAccount.findMany({
      where: {
        isConnected: true,
        OR: [{ syncStatus: "idle" }, { syncStatus: "error" }],
      },
      select: { id: true },
    });

    for (const account of accounts) {
      try {
        await this.syncWithRetry(account.id);
      } catch (error) {
        console.error("Email sync failed after retries", { accountId: account.id, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  private async syncWithRetry(accountId: string, maxRetries = 2) {
    let attempt = 0;
    for (;;) {
      try {
        return await this.syncAccountById(accountId);
      } catch (error) {
        if (error instanceof Error && error.message === "Account is already syncing") {
          return { skipped: true, reason: "already_syncing", accountId };
        }
        if (attempt >= maxRetries) throw error;
        attempt += 1;
        const waitMs = 500 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  async syncAccountById(accountId: string, scope?: { orgId?: string; userId?: string }) {
    const db = this.deps.db ?? prisma;
    const account = await db.emailAccount.findFirst({
      where: {
        id: accountId,
        ...(scope?.orgId ? { orgId: scope.orgId } : {}),
        ...(scope?.userId ? { userId: scope.userId } : {}),
      },
    }) as Account | null;

    if (!account) {
      throw new Error("Email account not found");
    }

    const lockResult = await db.emailAccount.updateMany({
      where: { id: account.id, syncStatus: { not: "syncing" } },
      data: { syncStatus: "syncing", errorMessage: null },
    });

    if (lockResult.count === 0) {
      throw new Error("Account is already syncing");
    }

    const syncLog = await db.syncLog.create({
      data: {
        orgId: account.orgId,
        accountId: account.id,
        status: "in_progress",
      },
    });

    try {
      const auth = await this.resolveAccessToken(account);
      const fetchedMessages = await this.fetchProviderMessages(account, auth.accessToken);
      const result = await this.saveMessages(account, fetchedMessages);

      await db.emailAccount.update({
        where: { id: account.id },
        data: {
          syncStatus: "idle",
          lastSyncAt: new Date(),
          errorMessage: null,
          settings: { ...(account.settings || {}), requiresReconnect: false },
        },
      });

      await db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "success",
          emailsSynced: result.emailsSynced,
          threadsSynced: result.threadsSynced,
          completedAt: new Date(),
          duration: Date.now() - syncLog.startedAt.getTime(),
        },
      });

      return { accountId: account.id, ...result };
    } catch (error: any) {
      const revoked = this.isRevokedTokenError(error);
      await db.emailAccount.update({
        where: { id: account.id },
        data: {
          isConnected: revoked ? false : undefined,
          syncStatus: "error",
          errorMessage: revoked ? "Token revoked. Reconnect required." : error.message || "Unknown error",
          settings: revoked ? { ...(account.settings || {}), requiresReconnect: true } : undefined,
        },
      });

      await db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "error",
          errors: [error.message || "Unknown error"],
          completedAt: new Date(),
          duration: Date.now() - syncLog.startedAt.getTime(),
        },
      });
      throw error;
    }
  }

  private async resolveAccessToken(account: Account) {
    const db = this.deps.db ?? prisma;
    const decryptFn = this.deps.decryptFn ?? decrypt;
    const encryptFn = this.deps.encryptFn ?? encrypt;
    const gmailClient = this.deps.gmail ?? googleAuth;
    const outlookClient = this.deps.outlook ?? outlookAuth;

    const accessToken = account.accessToken ? decryptFn(account.accessToken) : "";
    const refreshToken = account.refreshToken ? decryptFn(account.refreshToken) : "";

    if (!refreshToken && !accessToken) {
      throw new Error("No refresh token available");
    }

    if (accessToken && account.expiresAt && account.expiresAt.getTime() > Date.now() + 60_000) {
      return { accessToken };
    }

    if (!refreshToken) {
      return { accessToken };
    }

    if (account.provider === "gmail") {
      const refreshed = await gmailClient.refreshAccessToken(refreshToken);
      await db.emailAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptFn(refreshed.accessToken),
          refreshToken: refreshed.refreshToken ? encryptFn(refreshed.refreshToken) : account.refreshToken,
          expiresAt: new Date(Date.now() + 55 * 60 * 1000),
          isConnected: true,
        },
      });
      return { accessToken: refreshed.accessToken };
    }

    if (account.provider === "outlook") {
      const refreshed = await outlookClient.refreshAccessToken(refreshToken);
      await db.emailAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptFn(refreshed.accessToken),
          refreshToken: refreshed.refreshToken ? encryptFn(refreshed.refreshToken) : account.refreshToken,
          expiresAt: refreshed.expiresAt,
          isConnected: true,
        },
      });
      return { accessToken: refreshed.accessToken };
    }

    throw new Error(`Unsupported provider: ${account.provider}`);
  }

  private async fetchProviderMessages(account: Account, accessToken: string) {
    const gmailClient = this.deps.gmail ?? googleAuth;
    const outlookClient = this.deps.outlook ?? outlookAuth;

    if (account.provider === "gmail") {
      return gmailClient.fetchMessages(accessToken, account.lastSyncAt ?? undefined);
    }
    if (account.provider === "outlook") {
      return outlookClient.fetchMessages(accessToken, account.lastSyncAt ?? undefined);
    }
    throw new Error(`Unsupported provider: ${account.provider}`);
  }

  private async saveMessages(account: Account, messages: any[]) {
    const db = this.deps.db ?? prisma;
    const seen = new Set<string>();
    let emailsSynced = 0;
    const touchedThreads = new Set<string>();

    for (const msg of messages) {
      if (!msg?.messageId || seen.has(msg.messageId)) continue;
      seen.add(msg.messageId);

      const direction = msg.fromEmail?.toLowerCase() === account.email.toLowerCase() ? "outbound" : "inbound";
      const toEmails = (msg.toEmails ?? []).filter(Boolean);
      const ccEmails = (msg.ccEmails ?? []).filter(Boolean);
      const bccEmails = (msg.bccEmails ?? []).filter(Boolean);

      const assoc = await this.resolveAssociations(account.orgId, msg.fromEmail, [...toEmails, ...ccEmails, ...bccEmails]);

      if (msg.threadId) {
        const participants = Array.from(new Set([msg.fromEmail, ...toEmails, ...ccEmails, ...bccEmails].filter(Boolean)));
        await db.emailThread.upsert({
          where: { id: msg.threadId },
          update: {
            subject: msg.subject,
            lastMessageId: msg.messageId,
            lastMessageAt: msg.sentAt || msg.receivedAt || new Date(),
            participants,
            relatedDealId: msg.relatedDealId || assoc.relatedDealId,
          },
          create: {
            id: msg.threadId,
            orgId: account.orgId,
            accountId: account.id,
            subject: msg.subject,
            firstMessageId: msg.messageId,
            lastMessageId: msg.messageId,
            messageCount: 1,
            participants,
            lastMessageAt: msg.sentAt || msg.receivedAt || new Date(),
            relatedDealId: msg.relatedDealId || assoc.relatedDealId,
          },
        });
      }

      await db.email.upsert({
        where: { accountId_messageId: { accountId: account.id, messageId: msg.messageId } },
        update: {
          threadId: msg.threadId,
          subject: msg.subject,
          fromName: msg.fromName,
          fromEmail: msg.fromEmail,
          toEmails,
          ccEmails,
          bccEmails,
          textBody: msg.textBody,
          htmlBody: msg.htmlBody,
          snippet: msg.snippet,
          hasAttachments: !!msg.hasAttachments,
          attachmentCount: msg.attachmentCount ?? 0,
          attachmentMetadata: msg.attachmentMetadata,
          labels: msg.labels || [],
          isRead: !!msg.isRead,
          sentAt: msg.sentAt || new Date(),
          receivedAt: msg.receivedAt || new Date(),
          relatedContactId: msg.relatedContactId || assoc.relatedContactId,
          relatedDealId: msg.relatedDealId || assoc.relatedDealId,
          rawHeaders: msg.rawHeaders,
          inReplyTo: msg.inReplyTo,
          references: msg.references || [],
          updatedAt: new Date(),
        },
        create: {
          orgId: account.orgId,
          accountId: account.id,
          messageId: msg.messageId,
          threadId: msg.threadId,
          subject: msg.subject,
          fromName: msg.fromName,
          fromEmail: msg.fromEmail,
          toEmails,
          ccEmails,
          bccEmails,
          textBody: msg.textBody,
          htmlBody: msg.htmlBody,
          snippet: msg.snippet,
          hasAttachments: !!msg.hasAttachments,
          attachmentCount: msg.attachmentCount ?? 0,
          attachmentMetadata: msg.attachmentMetadata,
          labels: msg.labels || [],
          isRead: !!msg.isRead,
          direction,
          sentAt: msg.sentAt || new Date(),
          receivedAt: msg.receivedAt || new Date(),
          relatedContactId: msg.relatedContactId || assoc.relatedContactId,
          relatedDealId: msg.relatedDealId || assoc.relatedDealId,
          rawHeaders: msg.rawHeaders,
          inReplyTo: msg.inReplyTo,
          references: msg.references || [],
        },
      });

      if (msg.threadId) {
        touchedThreads.add(msg.threadId);
      }
      emailsSynced += 1;
    }

    return { emailsSynced, threadsSynced: touchedThreads.size };
  }

  async getAccountSyncLogs(accountId: string, scope: { orgId: string; userId?: string }, limit = 50) {
    const db = this.deps.db ?? prisma;
    const account = await db.emailAccount.findFirst({ where: { id: accountId, orgId: scope.orgId, ...(scope.userId ? { userId: scope.userId } : {}) }, select: { id: true } });
    if (!account) throw new Error("Email account not found");
    return db.syncLog.findMany({ where: { orgId: scope.orgId, accountId }, orderBy: { startedAt: "desc" }, take: Math.min(Math.max(limit, 1), 200) });
  }

  async getSyncStatus(scope: { orgId: string; userId?: string }) {
    const db = this.deps.db ?? prisma;
    const whereAccounts: any = { orgId: scope.orgId, ...(scope.userId ? { userId: scope.userId } : {}) };
    const [totalAccounts, connectedAccounts, syncingAccounts, errorAccounts, latestLogs] = await Promise.all([
      db.emailAccount.count({ where: whereAccounts }),
      db.emailAccount.count({ where: { ...whereAccounts, isConnected: true } }),
      db.emailAccount.count({ where: { ...whereAccounts, syncStatus: "syncing" } }),
      db.emailAccount.count({ where: { ...whereAccounts, syncStatus: "error" } }),
      db.syncLog.findMany({ where: { orgId: scope.orgId, account: { is: whereAccounts } }, orderBy: { startedAt: "desc" }, take: 10 }),
    ]);

    return {
      totalAccounts,
      connectedAccounts,
      syncingAccounts,
      errorAccounts,
      recentRuns: latestLogs,
    };
  }

  private async resolveAssociations(orgId: string, fromEmail?: string, recipients: string[] = []) {
    const db = this.deps.db ?? prisma;
    const candidates = [fromEmail, ...recipients].filter((e): e is string => !!e).map((e) => e.toLowerCase());
    if (candidates.length === 0) {
      return { relatedContactId: undefined, relatedDealId: undefined };
    }

    const existing = await db.email.findFirst({
      where: {
        orgId,
        AND: [
          {
            OR: [
              { fromEmail: { in: candidates } },
              { toEmails: { hasSome: candidates } },
            ],
          },
          {
            OR: [{ relatedContactId: { not: null } }, { relatedDealId: { not: null } }],
          },
        ],
      },
      orderBy: { sentAt: "desc" },
      select: { relatedContactId: true, relatedDealId: true },
    });

    return {
      relatedContactId: existing?.relatedContactId ?? undefined,
      relatedDealId: existing?.relatedDealId ?? undefined,
    };
  }
}
