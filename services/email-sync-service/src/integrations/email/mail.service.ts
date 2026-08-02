import { prisma } from "../../database/prisma/prisma.client.js";
import { decrypt, encrypt } from "../../shared/utils/encryption.js";
import { GoogleAuthService } from "./google-auth.service.js";
import { OutlookAuthService } from "./outlook-auth.service.js";

const googleAuth = new GoogleAuthService();
const outlookAuth = new OutlookAuthService();

export class MailService {
  constructor(
    private readonly deps: {
      db?: typeof prisma;
      decryptFn?: typeof decrypt;
      encryptFn?: typeof encrypt;
      gmail?: GoogleAuthService;
      outlook?: OutlookAuthService;
    } = {}
  ) {}

  private isExpired(expiresAt?: Date | null) {
    if (!expiresAt) return false;
    return expiresAt.getTime() <= Date.now() + 60_000;
  }

  private isRevokedTokenError(error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return message.includes("invalid_grant") || message.includes("invalid token") || message.includes("token has expired") || message.includes("unauthorized");
  }

  private async resolveAccessToken(account: any, db: typeof prisma, decryptFn: typeof decrypt, encryptFn: typeof encrypt) {
    const currentAccessToken = account.accessToken ? decryptFn(account.accessToken) : "";
    const currentRefreshToken = account.refreshToken ? decryptFn(account.refreshToken) : "";

    if (currentAccessToken && !this.isExpired(account.expiresAt)) {
      return { accessToken: currentAccessToken };
    }

    if (!currentRefreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      if (account.provider === "gmail") {
        const refreshed = await (this.deps.gmail ?? googleAuth).refreshAccessToken(currentRefreshToken);
        await db.emailAccount.update({
          where: { id: account.id },
          data: {
            accessToken: encryptFn(refreshed.accessToken),
            refreshToken: refreshed.refreshToken ? encryptFn(refreshed.refreshToken) : account.refreshToken,
            expiresAt: new Date(Date.now() + 55 * 60 * 1000),
            isConnected: true,
            errorMessage: null,
            settings: { ...(account.settings as object || {}), requiresReconnect: false },
          },
        });
        return { accessToken: refreshed.accessToken };
      }

      if (account.provider === "outlook") {
        const refreshed = await (this.deps.outlook ?? outlookAuth).refreshAccessToken(currentRefreshToken);
        await db.emailAccount.update({
          where: { id: account.id },
          data: {
            accessToken: encryptFn(refreshed.accessToken),
            refreshToken: refreshed.refreshToken ? encryptFn(refreshed.refreshToken) : account.refreshToken,
            expiresAt: refreshed.expiresAt,
            isConnected: true,
            errorMessage: null,
            settings: { ...(account.settings as object || {}), requiresReconnect: false },
          },
        });
        return { accessToken: refreshed.accessToken };
      }

      throw new Error(`Unsupported provider: ${account.provider}`);
    } catch (error) {
      if (this.isRevokedTokenError(error)) {
        await db.emailAccount.update({
          where: { id: account.id },
          data: {
            isConnected: false,
            syncStatus: "error",
            errorMessage: "Token revoked. Reconnect required.",
            settings: { ...(account.settings as object || {}), requiresReconnect: true },
          },
        });
      }
      throw error;
    }
  }

  async sendEmail(params: {
    orgId: string,
    userId: string,
    accountId?: string,
    to: string | string[],
    subject: string,
    body: string,
    cc?: string | string[],
    bcc?: string | string[],
    isHtml?: boolean,
    relatedDealId?: string,
    relatedContactId?: string
  }) {
    const { orgId, userId, accountId, to, subject, body, cc, bcc, isHtml, relatedDealId, relatedContactId } = params;

    const db = this.deps.db ?? prisma;
    const decryptFn = this.deps.decryptFn ?? decrypt;
    const encryptFn = this.deps.encryptFn ?? encrypt;
    const gmailClient = this.deps.gmail ?? googleAuth;
    const outlookClient = this.deps.outlook ?? outlookAuth;

    let account;
    if (accountId) {
      account = await db.emailAccount.findFirst({
        where: { id: accountId, orgId, userId, isConnected: true }
      });
    } else {
      account = await db.emailAccount.findFirst({
        where: { orgId, userId, isConnected: true },
        orderBy: { createdAt: "desc" }
      });
    }

    if (!account) {
      throw new Error("No connected email account found");
    }

    const { accessToken } = await this.resolveAccessToken(account, db, decryptFn, encryptFn);

    let sendResult: any = {};
    if (account.provider === "gmail") {
      sendResult = await gmailClient.sendEmail(accessToken, { to, subject, body, cc, bcc, isHtml });
    } else if (account.provider === "outlook") {
      sendResult = await outlookClient.sendEmail(accessToken, { to, subject, body, cc, bcc, isHtml });
    }

    const messageId = sendResult.id || `sent-${Date.now()}`;

    const emailRecord = await db.email.create({
      data: {
        orgId,
        accountId: account.id,
        messageId,
        subject,
        fromEmail: account.email,
        fromName: account.email,
        toEmails: Array.isArray(to) ? to : [to],
        ccEmails: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
        bccEmails: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
        textBody: isHtml ? undefined : body,
        htmlBody: isHtml ? body : undefined,
        direction: "outbound",
        sentAt: new Date(),
        receivedAt: new Date(),
        relatedDealId,
        relatedContactId
      },
    });

    return emailRecord;
  }
}
