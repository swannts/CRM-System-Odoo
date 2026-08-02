import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { BookingTypesRepository } from './repositories/booking-types.repository.js';
import { CreateBookingTypeDto } from './dto/create-booking-type.dto.js';
import { UpdateBookingTypeDto } from './dto/update-booking-type.dto.js';

@Injectable()
export class BookingTypesService {
  constructor(private readonly bookingTypesRepository: BookingTypesRepository) {}

  async create(orgId: string, data: CreateBookingTypeDto) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    return this.bookingTypesRepository.create(orgId, data);
  }

  async findAll(orgId: string) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    return this.bookingTypesRepository.findAll(orgId);
  }

  async findOne(idOrSlug: string) {
    const bookingType = await this.bookingTypesRepository.findByIdOrSlug(idOrSlug);

    if (!bookingType) {
      throw new NotFoundException(`Booking type ${idOrSlug} not found`);
    }

    return bookingType;
  }

  async update(id: string, data: UpdateBookingTypeDto) {
    return this.bookingTypesRepository.update(id, data);
  }

  async remove(id: string) {
    return this.bookingTypesRepository.remove(id);
  }
}
