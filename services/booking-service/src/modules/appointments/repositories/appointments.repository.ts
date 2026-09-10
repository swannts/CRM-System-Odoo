import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { isAvailableStart } from '../domain/scheduling.js';
import { PrismaService } from '../../../database/prisma/prisma.service.js';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(orgId: string, input: Record<string, any>, id?: string) {
    return this.prisma.$transaction(async tx => {
      // Serialize appointment writes per organization across service replicas.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orgId}))`;
      const existing = id ? await tx.appointment.findFirst({ where: { id, orgId } }) : null;
      if (id && !existing) throw new NotFoundException('Appointment not found');
      const bookingTypeId = input.bookingTypeId ?? existing?.bookingTypeId;
      const bookingType = await tx.bookingType.findFirst({ where: { id: bookingTypeId, orgId }, include: { availabilities: true } });
      if (!bookingType) throw new NotFoundException('Booking type not found');
      const startTime = new Date(input.startTime ?? existing?.startTime);
      const endTime = existing && input.startTime === undefined && input.bookingTypeId === undefined ? existing.endTime : new Date(startTime.getTime() + bookingType.durationMinutes * 60000);
      const status = input.status ?? existing?.status ?? 'PENDING';
      if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) throw new BadRequestException('Invalid appointment status');
      const scheduleChanged = !existing || input.startTime !== undefined || input.bookingTypeId !== undefined || (existing.status === 'CANCELLED' && status !== 'CANCELLED');
      if (scheduleChanged && status !== 'CANCELLED' && !isAvailableStart(bookingType, startTime)) throw new BadRequestException('Requested time is outside available booking slots');
      if (status !== 'CANCELLED') {
        const buffer = bookingType.bufferMinutes * 60000;
        const conflict = await tx.appointment.findFirst({ where: {
          orgId, bookingTypeId, ...(id ? { id: { not: id } } : {}),
          status: { not: 'CANCELLED' },
          startTime: { lt: new Date(endTime.getTime() + buffer) },
          endTime: { gt: new Date(startTime.getTime() - buffer) },
        } });
        if (conflict) throw new ConflictException('This time slot has already been booked');
      }
      const data = { ...input, orgId, bookingTypeId, startTime, endTime, status };
      return id ? tx.appointment.update({ where: { id }, data }) : tx.appointment.create({ data });
    });
  }

  findMany(orgId: string, contactId?: string) {
    const where: any = { orgId };
    if (contactId) where.contactId = contactId;

    return this.prisma.appointment.findMany({
      where,
      include: {
        bookingType: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  findManyWithoutRelations(orgId: string, contactId?: string) {
    const where: any = { orgId };
    if (contactId) where.contactId = contactId;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }

  findOne(orgId: string, id: string) {
    return this.prisma.appointment.findFirst({
      where: { id, orgId },
      include: { bookingType: true },
    });
  }

  updateMany(orgId: string, id: string, data: Record<string, unknown>) {
    return this.prisma.appointment.updateMany({
      where: { id, orgId },
      data: data as any,
    });
  }

  findForDay(bookingTypeId: string, dayStart: Date, dayEnd: Date) {
    return this.prisma.appointment.findMany({
      where: {
        bookingTypeId,
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
        status: { notIn: ['CANCELLED'] },
      },
    });
  }
}
