import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private prisma: PrismaService) {}

  async getStats(orgId: string) {
    let stats = await this.prisma.reputationStats.findUnique({
      where: { orgId },
    });

    if (!stats) {
      stats = await this.prisma.reputationStats.create({
        data: {
          orgId,
          averageRating: 0.0,
          totalReviews: 0,
        },
      });
    }

    return stats;
  }
}
