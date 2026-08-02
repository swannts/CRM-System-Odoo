import { db } from '../../db.js';
import type { ChatStatisticsInput } from '../../types/index.js';

export class LiveChatStatisticsRepository {
  async create(data: ChatStatisticsInput) {
    return db.liveChatStatistics.create({ data });
  }

  async findByOrganizationId(organizationId: string, startDate?: Date, endDate?: Date) {
    return db.liveChatStatistics.findMany({
      where: {
        organizationId,
        ...(startDate && endDate ? { date: { gte: startDate, lte: endDate } } : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  async updateDaily(organizationId: string, date: Date, data: Partial<ChatStatisticsInput>) {
    const existing = await db.liveChatStatistics.findFirst({
      where: { organizationId, date },
    });
    if (existing) {
      return db.liveChatStatistics.update({ where: { id: existing.id }, data });
    }
    return this.create({ ...data, organizationId, date });
  }
}
