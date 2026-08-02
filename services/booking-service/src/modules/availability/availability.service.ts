import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AvailabilityRepository } from './repositories/availability.repository.js';
import { BookingTypesRepository } from '../booking-types/repositories/booking-types.repository.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly bookingTypesRepository: BookingTypesRepository,
  ) {}

  private normalizeTime(value: string) {
    const trimmed = String(value || '').trim();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
      throw new BadRequestException('Time must use HH:mm format.');
    }
    return trimmed;
  }

  private assertRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('endTime must be after startTime.');
    }
  }

  async findAll(orgId: string, bookingTypeId?: string) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    return this.availabilityRepository.findAll(orgId, bookingTypeId);
  }

  async create(orgId: string, data: CreateAvailabilityDto) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    const bookingTypeId = String(data?.bookingTypeId || '').trim();
    if (!bookingTypeId) throw new BadRequestException('bookingTypeId is required.');

    const dayOfWeek = Number(data?.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek must be an integer between 0 and 6.');
    }

    const startTime = this.normalizeTime(data?.startTime);
    const endTime = this.normalizeTime(data?.endTime);
    this.assertRange(startTime, endTime);

    const bookingType = await this.bookingTypesRepository.findById(bookingTypeId);
    if (!bookingType) {
      throw new BadRequestException('bookingTypeId is invalid for this organization.');
    }
    if (bookingType.orgId !== orgId) {
      throw new BadRequestException('bookingTypeId is invalid for this organization.');
    }

    return this.availabilityRepository.create({
      bookingTypeId,
      dayOfWeek,
      startTime,
      endTime,
    });
  }

  async update(orgId: string, id: string, data: UpdateAvailabilityDto) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    const row = await this.availabilityRepository.findByIdAndOrg(id, orgId);
    if (!row) throw new NotFoundException(`Availability rule ${id} not found.`);

    const patch: any = {};
    if (data?.dayOfWeek !== undefined) {
      const dayOfWeek = Number(data.dayOfWeek);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new BadRequestException('dayOfWeek must be an integer between 0 and 6.');
      }
      patch.dayOfWeek = dayOfWeek;
    }

    if (data?.startTime !== undefined) patch.startTime = this.normalizeTime(data.startTime);
    if (data?.endTime !== undefined) patch.endTime = this.normalizeTime(data.endTime);

    const nextStart = patch.startTime ?? row.startTime;
    const nextEnd = patch.endTime ?? row.endTime;
    this.assertRange(nextStart, nextEnd);

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No updatable fields provided.');
    }

    return this.availabilityRepository.update(row.id, patch);
  }

  async remove(orgId: string, id: string) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    const row = await this.availabilityRepository.findByIdAndOrg(id, orgId);
    if (!row) throw new NotFoundException(`Availability rule ${id} not found.`);

    await this.availabilityRepository.delete(row.id);
    return { success: true };
  }
}
