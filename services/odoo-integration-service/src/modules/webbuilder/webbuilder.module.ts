import { Module } from '@nestjs/common';
import { WebbuilderController } from './webbuilder.controller.js';
import { WebbuilderService } from './webbuilder.service.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Module({
  controllers: [WebbuilderController],
  providers: [WebbuilderService, PrismaService],
  exports: [WebbuilderService],
})
export class WebbuilderModule {}
