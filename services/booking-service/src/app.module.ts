import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import databaseConfig from './config/database.config.js';
import { validateEnv } from './config/env.validation.js';
import { BookingTypesModule } from './modules/booking-types/booking-types.module.js';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { AvailabilityModule } from './modules/availability/availability.module.js';
import { PrismaModule } from './database/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    BookingTypesModule,
    AppointmentsModule,
    AvailabilityModule,
  ],
})
export class AppModule {}
