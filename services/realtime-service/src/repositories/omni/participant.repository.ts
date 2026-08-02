import { db } from '../../db.js';
import type { OmniParticipantInput } from '../../types/index.js';

export class OmniParticipantRepository {
  async create(data: OmniParticipantInput) {
    return db.omniParticipant.create({ data });
  }

  async findByConversationId(conversationId: string) {
    return db.omniParticipant.findMany({ where: { conversationId } });
  }

  async delete(id: string) {
    return db.omniParticipant.delete({ where: { id } });
  }
}
