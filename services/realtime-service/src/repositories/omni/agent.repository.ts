import { db } from '../../db.js';
import type { OmniAgentInput } from '../../types/index.js';

export class OmniAgentRepository {
  async upsertByOrgAndUser(
    organizationId: string,
    userId: string,
    data: Partial<OmniAgentInput>,
  ) {
    const existing = await db.omniAgent.findFirst({
      where: { organizationId, userId },
    });
    if (existing) {
      return db.omniAgent.update({
        where: { id: existing.id },
        data,
      });
    }

    return db.omniAgent.create({
      data: {
        organizationId,
        userId,
        ...data,
      },
    });
  }
}
