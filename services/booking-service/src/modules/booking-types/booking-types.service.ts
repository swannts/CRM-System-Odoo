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

    if (!bookingType || !bookingType.isActive) {
      throw new NotFoundException(`Booking type ${idOrSlug} not found`);
    }

    const { orgId: _orgId, ...publicType } = bookingType;
    return publicType;
  }

  async update(orgId: string, id: string, data: UpdateBookingTypeDto) {
    const existing = await this.bookingTypesRepository.findById(id);
    if (!existing || existing.orgId !== orgId) throw new NotFoundException('Booking type not found');
    return this.bookingTypesRepository.update(id, data);
  }

  async remove(orgId: string, id: string) {
    const existing = await this.bookingTypesRepository.findById(id);
    if (!existing || existing.orgId !== orgId) throw new NotFoundException('Booking type not found');
    return this.bookingTypesRepository.remove(id);
  }
}
