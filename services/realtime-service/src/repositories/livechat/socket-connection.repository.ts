import { db } from '../../db.js';
import type { SocketConnectionInput } from '../../types/index.js';

export class SocketConnectionRepository {
  async create(data: SocketConnectionInput) {
    return db.socketConnection.create({ data });
  }

  async findBySocketId(socketId: string) {
    return db.socketConnection.findUnique({ where: { socketId } });
  }

  async findByUserId(userId: string) {
    return db.socketConnection.findMany({ where: { userId } });
  }

  async findByOrganizationId(organizationId: string) {
    return db.socketConnection.findMany({
      where: { organizationId, disconnectedAt: null },
    });
  }

  async disconnect(socketId: string) {
    return db.socketConnection.update({
      where: { socketId },
      data: { disconnectedAt: new Date() },
    });
  }
}
