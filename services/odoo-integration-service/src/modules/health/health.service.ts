import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness() {
    return { status: 'ok', service: 'odoo-integration-service', ts: new Date().toISOString() };
  }

  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', checks: { db: 'ok' }, ts: new Date().toISOString() };
    } catch (error: any) {
      return { status: 'not_ready', checks: { db: error?.message || 'error' }, ts: new Date().toISOString() };
    }
  }
}
