import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { addMinutes, format, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';
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

    const startTime = new Date(data.startTime);
    const endTime = addMinutes(startTime, bookingType.durationMinutes);

    return this.appointmentsRepository.create(orgId, {
      ...data,
      startTime,
      endTime,
    });
  }

  async createPublic(data: CreateAppointmentDto) {
    if (!data?.bookingTypeId) {
      throw new BadRequestException('bookingTypeId is required for public booking');
    }

    const bookingType = await this.bookingTypesRepository.findById(data.bookingTypeId);

    if (!bookingType) throw new NotFoundException('Booking type not found');
    if (!bookingType.isActive) throw new BadRequestException('Booking type is not active');

    const startTime = new Date(data.startTime);
    const endTime = addMinutes(startTime, bookingType.durationMinutes);

    return this.appointmentsRepository.create(bookingType.orgId, {
      ...data,
      startTime,
      endTime,
    });
  }

  async findAll(orgId: string, contactId?: string) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');

    try {
      return await this.appointmentsRepository.findMany(orgId, contactId);
    } catch (errorWithInclude) {
      // Keep the endpoint usable even if relational rows are partially inconsistent.
      try {
        return await this.appointmentsRepository.findManyWithoutRelations(orgId, contactId);
      } catch (errorPlain) {
        console.error('AppointmentsService.findAll failed', {
          orgId,
          contactId,
          errorWithInclude: errorWithInclude instanceof Error ? errorWithInclude.message : String(errorWithInclude),
          errorPlain: errorPlain instanceof Error ? errorPlain.message : String(errorPlain),
        });
        return [];
      }
    }
  }

  async findOne(orgId: string, id: string) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');

    const appointment = await this.appointmentsRepository.findOne(orgId, id);

    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    return appointment;
  }

  async update(orgId: string, id: string, data: UpdateAppointmentDto) {
    if (!orgId) throw new UnauthorizedException('Missing X-Org-Id header');
    const { count } = await this.appointmentsRepository.updateMany(orgId, id, data);

    if (count === 0) throw new NotFoundException(`Appointment ${id} not found`);
    return this.findOne(orgId, id);
  }

  async getAvailableSlots(bookingTypeId: string, dateStr: string) {
    const bookingType = await this.bookingTypesRepository.findById(bookingTypeId);

    if (!bookingType) throw new NotFoundException('Booking type not found');

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayAvailability = bookingType.availabilities.find(a => a.dayOfWeek === dayOfWeek);

    if (!dayAvailability) return [];

    // Get existing appointments for this day
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const existingAppointments = await this.appointmentsRepository.findForDay(bookingTypeId, dayStart, dayEnd);

    // Generate possible slots
    const slots = [];
    const [startH, startM] = dayAvailability.startTime.split(':').map(Number);
    const [endH, endM] = dayAvailability.endTime.split(':').map(Number);

    let currentSlot = new Date(date);
    currentSlot.setHours(startH, startM, 0, 0);

    const dayEndTime = new Date(date);
    dayEndTime.setHours(endH, endM, 0, 0);

    while (isBefore(addMinutes(currentSlot, bookingType.durationMinutes), dayEndTime) || 
           format(addMinutes(currentSlot, bookingType.durationMinutes), 'HH:mm') === dayAvailability.endTime) {
      
      const slotEnd = addMinutes(currentSlot, bookingType.durationMinutes);
      
      // Check for overlap
      const isBooked = existingAppointments.some(app => {
        return (isBefore(currentSlot, app.endTime) && isAfter(slotEnd, app.startTime));
      });

      if (!isBooked) {
        slots.push({
          start: format(currentSlot, "yyyy-MM-dd'T'HH:mm:ssXXX"),
          end: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ssXXX"),
          label: format(currentSlot, 'HH:mm')
        });
      }

      currentSlot = addMinutes(currentSlot, bookingType.durationMinutes + bookingType.bufferMinutes);
    }

    return slots;
  }
}
