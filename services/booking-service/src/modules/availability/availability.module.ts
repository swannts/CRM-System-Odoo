import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller.js';
import { AvailabilityService } from './availability.service.js';
import { PrismaModule } from '../../database/prisma/prisma.module.js';
import { AvailabilityRepository } from './repositories/availability.repository.js';
import { BookingTypesRepository } from '../booking-types/repositories/booking-types.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRepository, BookingTypesRepository],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
