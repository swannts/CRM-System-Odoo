import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service.js';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(orgId: string, bookingTypeId?: string) {
    const where: any = { bookingType: { orgId } };
    if (bookingTypeId) where.bookingTypeId = bookingTypeId;

    return this.prisma.availability.findMany({
      where,
      include: {
        bookingType: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [{ bookingTypeId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  findByIdAndOrg(id: string, orgId: string) {
    return this.prisma.availability.findFirst({
      where: { id, bookingType: { orgId } },
      include: { bookingType: { select: { id: true } } },
    });
  }

  create(data: { bookingTypeId: string; dayOfWeek: number; startTime: string; endTime: string }) {
    return this.prisma.availability.create({
      data,
      include: {
        bookingType: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.availability.update({
      where: { id },
      data,
      include: {
        bookingType: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  delete(id: string) {
    return this.prisma.availability.delete({ where: { id } });
  }
}
