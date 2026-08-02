import { db } from '../../db.js';
import type { OmniAgentTaskInput } from '../../types/index.js';

export class OmniAgentTaskRepository {
  async findByAgentId(agentId: string, organizationId: string) {
    return db.omniAgentTask.findMany({
      where: { agentId, organizationId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: OmniAgentTaskInput) {
    return db.omniAgentTask.create({ data });
  }

  async updateById(id: string, organizationId: string, agentId: string, data: Partial<OmniAgentTaskInput>) {
    return db.omniAgentTask.updateMany({
      where: { id, organizationId, agentId },
      data,
    });
  }

  async deleteById(id: string, organizationId: string, agentId: string) {
    return db.omniAgentTask.deleteMany({
      where: { id, organizationId, agentId },
    });
  }
}
