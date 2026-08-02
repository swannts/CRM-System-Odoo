import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Injectable()
export class WebbuilderService {
  private readonly logger = new Logger(WebbuilderService.name);

  constructor(private prisma: PrismaService) {}

  async listWebsites(orgId: string) {
    return this.prisma.website.findMany({
      where: { orgId },
    });
  }

  async createWebsite(orgId: string, data: any) {
    return this.prisma.website.create({
      data: {
        ...data,
        orgId,
      },
    });
  }
}
