import { db } from '../../db.js';
import type { LiveChatContactInput } from '../../types/index.js';

export class LiveChatContactRepository {
  async create(data: LiveChatContactInput) {
    return db.liveChatContact.create({ data });
  }

  async findById(id: string) {
    return db.liveChatContact.findUnique({ where: { id } });
  }

  async findByUserId(userId: string) {
    return db.liveChatContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<LiveChatContactInput>) {
    return db.liveChatContact.update({ where: { id }, data });
  }

  async findByPhone(phone: string, organizationId: string) {
    return db.liveChatContact.findFirst({
      where: { phone, organizationId },
    });
  }
}
