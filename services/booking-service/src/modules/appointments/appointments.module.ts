import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { AppointmentsController } from './appointments.controller.js';
import { PrismaModule } from '../../database/prisma/prisma.module.js';
import { AppointmentsRepository } from './repositories/appointments.repository.js';
import { BookingTypesRepository } from '../booking-types/repositories/booking-types.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository, BookingTypesRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
