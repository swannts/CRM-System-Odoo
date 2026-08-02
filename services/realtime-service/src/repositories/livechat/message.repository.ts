import { db } from '../../db.js';
import type { LiveChatMessageInput } from '../../types/index.js';

export class LiveChatMessageRepository {
  async create(data: LiveChatMessageInput) {
    return db.liveChatMessage.create({ data });
  }

  async findByChannelId(channelId: string, limit = 50) {
    return db.liveChatMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(channelId: string, senderId: string) {
    return db.liveChatMessage.updateMany({
      where: { channelId, senderId: { not: senderId } },
      data: { isRead: true },
    });
  }

  async getUnreadCount(channelId: string, excludeSenderId: string) {
    return db.liveChatMessage.count({
      where: { channelId, isRead: false, senderId: { not: excludeSenderId } },
    });
  }
}
