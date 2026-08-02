import { db } from '../../db.js';
import type { OmniMessageInput } from '../../types/index.js';

export class OmniMessageRepository {
  async create(data: OmniMessageInput) {
    return db.omniMessage.create({ data });
  }

  async findByConversationId(conversationId: string, limit = 50) {
    return db.omniMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async updateStatus(id: string, status: string) {
    return db.omniMessage.update({ where: { id }, data: { status } });
  }
}
