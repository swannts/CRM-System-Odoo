import { prisma } from '../../database/prisma/prisma.client.js';
import type { EmailAccountQuery, EmailAccountScope, EmailTemplateInput } from './email-sync.types.js';

export class EmailSyncRepository {
  constructor(private readonly db = prisma) {}

  listAccounts(scope: EmailAccountScope) {
    return this.db.emailAccount.findMany({
      where: { orgId: scope.orgId, userId: scope.userId },
      select: {
        id: true,
        email: true,
        provider: true,
        isConnected: true,
        lastSyncAt: true,
        syncStatus: true,
        createdAt: true,
        errorMessage: true,
        settings: true,
      },
    });
  }

  upsertConnectedAccount(params: {
    orgId: string;
    userId: string;
    email: string;
    provider: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }) {
    return this.db.emailAccount.upsert({
      where: {
        orgId_userId_provider_email: {
          orgId: params.orgId,
          userId: params.userId,
          provider: params.provider,
          email: params.email,
        },
      },
      update: {
        isConnected: true,
        accessToken: params.accessToken,
        ...(params.refreshToken ? { refreshToken: params.refreshToken } : {}),
        ...(params.expiresAt ? { expiresAt: params.expiresAt } : {}),
        syncStatus: 'idle',
      },
      create: {
        orgId: params.orgId,
        userId: params.userId,
        email: params.email,
        provider: params.provider,
        isConnected: true,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        expiresAt: params.expiresAt,
        syncStatus: 'idle',
      },
    });
  }

  listOwnedAccountIds(scope: EmailAccountScope) {
    return this.db.emailAccount.findMany({
      where: { orgId: scope.orgId, userId: scope.userId },
      select: { id: true },
    });
  }

  listMessages(scope: EmailAccountScope, query: EmailAccountQuery, ownedAccountIds: string[]) {
    const where: any = { orgId: scope.orgId, accountId: { in: ownedAccountIds } };

    if (query.accountId) {
      where.accountId = query.accountId;
    }
    if (query.threadId) {
      where.threadId = query.threadId;
    }
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { fromEmail: { contains: query.search, mode: 'insensitive' } },
        { fromName: { contains: query.search, mode: 'insensitive' } },
        { textBody: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.folder === 'sent') {
      where.direction = 'outbound';
    } else if (query.folder === 'inbox') {
      where.direction = 'inbound';
    }

    const take = Number.parseInt(String(query.limit ?? 50), 10) || 50;
    const skip = Number.parseInt(String(query.offset ?? 0), 10) || 0;

    return Promise.all([
      this.db.email.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          accountId: true,
          threadId: true,
          subject: true,
          fromName: true,
          fromEmail: true,
          toEmails: true,
          snippet: true,
          hasAttachments: true,
          isRead: true,
          isImportant: true,
          direction: true,
          sentAt: true,
          labels: true,
        },
      }),
      this.db.email.count({ where }),
      take,
      skip,
    ]).then(([messages, total, resolvedTake, resolvedSkip]) => ({
      messages,
      total,
      take: resolvedTake,
      skip: resolvedSkip,
    }));
  }

  listTemplates(orgId: string, category?: string) {
    return this.db.emailTemplate.findMany({
      where: {
        orgId,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createTemplate(input: EmailTemplateInput) {
    return this.db.emailTemplate.create({
      data: {
        orgId: input.orgId,
        createdBy: input.userId,
        name: input.name,
        subject: input.subject,
        body: input.body,
        category: input.category,
        variables: input.variables,
      },
    });
  }
}
