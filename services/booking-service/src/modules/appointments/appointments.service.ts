import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { availableStarts } from './domain/scheduling.js';
import { AppointmentsRepository } from './repositories/appointments.repository.js';
import { BookingTypesRepository } from '../booking-types/repositories/booking-types.repository.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly bookingTypesRepository: BookingTypesRepository,
  ) {}

  async create(orgId: string, data: CreateAppointmentDto) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');

    const bookingType = await this.bookingTypesRepository.findById(data.bookingTypeId);

    if (!bookingType) throw new NotFoundException('Booking type not found');
    if (bookingType.orgId !== orgId) {
      throw new BadRequestException('Booking type does not belong to the authenticated organization');
    }

    return this.appointmentsRepository.save(orgId, data);
  }

  async createPublic(data: CreateAppointmentDto) {
    if (!data?.bookingTypeId) {
      throw new BadRequestException('bookingTypeId is required for public booking');
    }

    const bookingType = await this.bookingTypesRepository.findById(data.bookingTypeId);

    if (!bookingType) throw new NotFoundException('Booking type not found');
    if (!bookingType.isActive) throw new BadRequestException('Booking type is not active');

    if (!data.guestName?.trim() || !data.guestEmail) throw new BadRequestException('Guest name and email are required.');
    // Public callers cannot impersonate contacts or mark a booking completed.
    return this.appointmentsRepository.save(bookingType.orgId, {
      bookingTypeId: data.bookingTypeId, startTime: data.startTime,
      notes: data.notes, status: 'PENDING', guestName: data.guestName.trim(), guestEmail: data.guestEmail.toLowerCase(),
    });
  }

  async findAll(orgId: string, contactId?: string) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');

    return this.appointmentsRepository.findMany(orgId, contactId);
  }

  async findOne(orgId: string, id: string) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');

    const appointment = await this.appointmentsRepository.findOne(orgId, id);

    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    return appointment;
  }

  async update(orgId: string, id: string, data: UpdateAppointmentDto) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    return this.appointmentsRepository.save(orgId, data, id);
  }

  async getAvailableSlots(bookingTypeId: string, dateStr: string) {
    const bookingType = await this.bookingTypesRepository.findById(bookingTypeId);

    if (!bookingType) throw new NotFoundException('Booking type not found');

    let slots: { start: string; end: string; label: string }[];
    try { slots = availableStarts(bookingType, dateStr); }
    catch { throw new BadRequestException('Invalid booking date or timezone'); }
    if (!slots.length) return [];
    const buffer = bookingType.bufferMinutes * 60000;
    const existing = await this.appointmentsRepository.findForDay(bookingTypeId,
      new Date(Date.parse(slots[0].start) - buffer),
      new Date(Date.parse(slots[slots.length - 1].end) + buffer));
    return slots.filter(slot => !existing.some(appointment =>
      Date.parse(slot.start) < appointment.endTime.getTime() + buffer &&
      Date.parse(slot.end) + buffer > appointment.startTime.getTime()));
  }
}
