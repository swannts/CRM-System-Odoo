import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service.js';
import { slugifyLabel } from '../../../common/utils/slugify.js';
import { CreateBookingTypeDto } from '../dto/create-booking-type.dto.js';
import { UpdateBookingTypeDto } from '../dto/update-booking-type.dto.js';

type NestedAvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function stripAvailabilityBinding(
  availability: any,
): NestedAvailabilityInput {
  const { bookingTypeId: _bookingTypeId, ...rest } = availability;
  return rest as NestedAvailabilityInput;
}

@Injectable()
export class BookingTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(orgId: string, data: CreateBookingTypeDto) {
    const slug = data.slug || slugifyLabel(data.title);

    return this.prisma.bookingType.create({
      data: {
        ...data,
        orgId,
        slug,
        availabilities: {
          create: (data.availabilities || []).map(stripAvailabilityBinding),
        },
      },
      include: {
        availabilities: true,
      },
    });
  }

  findAll(orgId: string) {
    return this.prisma.bookingType.findMany({
      where: { orgId, isActive: true },
      include: {
        availabilities: true,
      },
    });
  }

  findByIdOrSlug(idOrSlug: string) {
    return this.prisma.bookingType.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        availabilities: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.bookingType.findUnique({
      where: { id },
      include: {
        availabilities: true,
      },
    });
  }

  async update(id: string, data: UpdateBookingTypeDto) {
    const { availabilities, ...rest } = data;

    if (availabilities) {
      return this.prisma.$transaction(async (tx) => {
        await tx.availability.deleteMany({
          where: { bookingTypeId: id },
        });

        return tx.bookingType.update({
          where: { id },
          data: {
            ...rest,
            availabilities: {
              create: availabilities.map(stripAvailabilityBinding),
            },
          },
          include: {
            availabilities: true,
          },
        });
      });
    }

    return this.prisma.bookingType.update({
      where: { id },
      data: rest,
      include: {
        availabilities: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.bookingType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
