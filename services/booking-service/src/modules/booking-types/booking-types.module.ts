import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module.js';
import { BookingTypesService } from './booking-types.service.js';
import { BookingTypesController } from './booking-types.controller.js';
import { BookingTypesRepository } from './repositories/booking-types.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [BookingTypesController],
  providers: [BookingTypesService, BookingTypesRepository],
  exports: [BookingTypesService],
})
export class BookingTypesModule {}
