import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service.js';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(orgId: string, data: Record<string, unknown>) {
    return this.prisma.appointment.create({
      data: {
        ...data,
        orgId,
      } as any,
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
        startTime: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELLED'] },
      },
    });
  }
}
