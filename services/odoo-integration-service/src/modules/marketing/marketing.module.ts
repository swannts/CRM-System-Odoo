import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service.js';
import { MarketingController } from './marketing.controller.js';
import { OdooBaseModule } from '../odoo-base/odoo-base.module.js';
import { PrismaModule } from '../../database/prisma/prisma.module.js';

@Module({
  imports: [OdooBaseModule, PrismaModule],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
