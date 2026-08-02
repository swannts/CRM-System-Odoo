import { db } from '../../db.js';
import type { LiveChatChannelInput } from '../../types/index.js';

export class LiveChatChannelRepository {
  async create(data: LiveChatChannelInput) {
    return db.liveChatChannel.create({ data });
  }

  async findById(id: string) {
    return db.liveChatChannel.findUnique({ where: { id } });
  }

  async findByAdminId(adminId: string) {
    return db.liveChatChannel.findMany({
      where: { adminId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByOrganizationId(organizationId: string) {
    return db.liveChatChannel.findMany({
      where: { organizationId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByContactId(contactId: string) {
    return db.liveChatChannel.findMany({
      where: { contactId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<LiveChatChannelInput>) {
    return db.liveChatChannel.update({ where: { id }, data });
  }

  async delete(id: string) {
    return db.liveChatChannel.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateLastMessage(id: string) {
    return db.liveChatChannel.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
  }
}
