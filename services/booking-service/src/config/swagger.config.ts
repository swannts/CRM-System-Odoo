import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Booking Service')
    .setDescription('The MyManager Booking & Appointment API')
    .setVersion('1.0')
    .addTag('booking')
    .build();
}
