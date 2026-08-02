import { Module } from '@nestjs/common';
import { ReputationController } from './reputation.controller.js';
import { ReputationService } from './reputation.service.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Module({
  controllers: [ReputationController],
  providers: [ReputationService, PrismaService],
  exports: [ReputationService],
})
export class ReputationModule {}
