import { db } from '../../db.js';
import type { OmniConversationInput } from '../../types/index.js';

export class OmniConversationRepository {
  async create(data: OmniConversationInput) {
    return db.omniConversation.create({ data });
  }

  async findById(id: string) {
    return db.omniConversation.findUnique({
      where: { id },
      include: { participants: true },
    });
  }

  async findByOrganizationId(organizationId: string) {
    return db.omniConversation.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      include: { participants: true },
    });
  }

  async findByOrganizationIdAndAssignedAgent(organizationId: string, assignedAgentId: string) {
    return db.omniConversation.findMany({
      where: { organizationId, assignedAgentId },
      orderBy: { updatedAt: 'desc' },
      include: { participants: true },
    });
  }

  async findByOrganizationAndProviderRef(organizationId: string, provider: string, providerRef: string) {
    return db.omniConversation.findFirst({
      where: { organizationId, provider, providerRef },
    });
  }

  async findByContactId(contactId: string) {
    return db.omniConversation.findMany({
      where: { contactId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<OmniConversationInput>) {
    return db.omniConversation.update({ where: { id }, data });
  }

  async assignAgent(id: string, agentId: string) {
    return db.omniConversation.update({
      where: { id },
      data: { assignedAgentId: agentId },
    });
  }
}
