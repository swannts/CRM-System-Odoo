import { db } from '../../db.js';
import type { LiveChatWidgetSettingInput } from '../../types/index.js';

export class LiveChatWidgetSettingRepository {
  async upsert(
    userId: string,
    organizationId: string | undefined,
    data: LiveChatWidgetSettingInput,
  ) {
    const existing = await db.liveChatWidgetSetting.findFirst({
      where: { userId },
    });
    if (existing) {
      return db.liveChatWidgetSetting.update({ where: { id: existing.id }, data });
    }
    return db.liveChatWidgetSetting.create({
      data: { ...data, userId, organizationId },
    });
  }

  async findByUserId(userId: string) {
    return db.liveChatWidgetSetting.findFirst({ where: { userId } });
  }

  async findByOrganizationId(organizationId: string) {
    return db.liveChatWidgetSetting.findFirst({ where: { organizationId } });
  }
}
