import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listTickets(orgId: string, filters?: { status?: string }) {
    return this.prisma.supportTicket.findMany({
      where: {
        orgId,
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createTicket(orgId: string, userId: string, body: any) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        orgId,
        subject: String(body?.subject || 'Support request'),
        description: body?.description ? String(body.description) : null,
        status: String(body?.status || 'open'),
        priority: String(body?.priority || 'medium'),
        assigneeUserId: body?.assigneeUserId ? String(body.assigneeUserId) : null,
        customerContactId: Number.isFinite(Number(body?.customerContactId)) ? Number(body.customerContactId) : null,
        customerCompanyId: Number.isFinite(Number(body?.customerCompanyId)) ? Number(body.customerCompanyId) : null,
        slaDueAt: body?.slaDueAt ? new Date(body.slaDueAt) : null,
        createdByUserId: userId,
      },
    });
    this.logger.log(JSON.stringify({ event: 'support.ticket.create', orgId, ticketId: ticket.id, userId }));
    return ticket;
  }

  async getTicket(orgId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { orgId, id },
      include: {
        notes: { orderBy: { createdAt: 'asc' } },
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicket(orgId: string, id: string, body: any) {
    const existing = await this.prisma.supportTicket.findFirst({ where: { orgId, id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Ticket not found');

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        subject: body?.subject,
        description: body?.description,
        status: body?.status,
        priority: body?.priority,
        assigneeUserId: body?.assigneeUserId,
        customerContactId: body?.customerContactId,
        customerCompanyId: body?.customerCompanyId,
        slaDueAt: body?.slaDueAt ? new Date(body.slaDueAt) : body?.slaDueAt === null ? null : undefined,
        slaBreached: typeof body?.slaBreached === 'boolean' ? body.slaBreached : undefined,
        closedAt: body?.status === 'closed' || body?.status === 'resolved' ? new Date() : undefined,
      },
    });
    this.logger.log(JSON.stringify({ event: 'support.ticket.update', orgId, ticketId: id, status: updated.status }));
    return updated;
  }

  async deleteTicket(orgId: string, id: string) {
    const existing = await this.prisma.supportTicket.findFirst({ where: { orgId, id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Ticket not found');
    await this.prisma.supportTicket.delete({ where: { id } });
    this.logger.log(JSON.stringify({ event: 'support.ticket.delete', orgId, ticketId: id }));
    return { id, deleted: true };
  }

  async addInternalNote(orgId: string, ticketId: string, body: string, authorId: string) {
    await this.ensureTicket(orgId, ticketId);
    const note = await this.prisma.supportTicketNote.create({
      data: {
        orgId,
        ticketId,
        body: String(body || '').trim(),
        authorId,
      },
    });
    this.logger.log(JSON.stringify({ event: 'support.ticket.note.create', orgId, ticketId, authorId }));
    return note;
  }

  async addReply(orgId: string, ticketId: string, body: string, authorId: string, visibleToCustomer = true) {
    await this.ensureTicket(orgId, ticketId);
    const reply = await this.prisma.supportTicketReply.create({
      data: {
        orgId,
        ticketId,
        body: String(body || '').trim(),
        authorId,
        visibleToCustomer,
      },
    });
    this.logger.log(JSON.stringify({ event: 'support.ticket.reply.create', orgId, ticketId, authorId, visibleToCustomer }));
    return reply;
  }

  async listCategories(orgId: string) {
    return this.prisma.supportKnowledgeCategory.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(orgId: string, body: any) {
    return this.prisma.supportKnowledgeCategory.create({
      data: {
        orgId,
        name: String(body?.name || 'General'),
        description: body?.description ? String(body.description) : null,
      },
    });
  }

  async listArticles(orgId: string, filters?: { categoryId?: string }) {
    return this.prisma.supportKnowledgeArticle.findMany({
      where: {
        orgId,
        ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      },
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createArticle(orgId: string, userId: string, body: any) {
    return this.prisma.supportKnowledgeArticle.create({
      data: {
        orgId,
        categoryId: body?.categoryId || null,
        title: String(body?.title || 'Untitled Article'),
        body: String(body?.body || ''),
        isPublic: Boolean(body?.isPublic),
        publishedAt: body?.isPublic ? new Date() : null,
        createdByUserId: userId,
      },
      include: { category: true },
    });
  }

  async updateArticle(orgId: string, id: string, body: any) {
    const existing = await this.prisma.supportKnowledgeArticle.findFirst({ where: { orgId, id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Article not found');

    return this.prisma.supportKnowledgeArticle.update({
      where: { id },
      data: {
        categoryId: body?.categoryId,
        title: body?.title,
        body: body?.body,
        isPublic: typeof body?.isPublic === 'boolean' ? body.isPublic : undefined,
        publishedAt: body?.isPublic === true ? new Date() : body?.isPublic === false ? null : undefined,
      },
      include: { category: true },
    });
  }

  async listPublicArticles(orgId: string) {
    return this.prisma.supportKnowledgeArticle.findMany({
      where: {
        orgId,
        isPublic: true,
      },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  private async ensureTicket(orgId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({ where: { orgId, id }, select: { id: true } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}
