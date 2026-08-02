import { db } from '../../../database/prisma/prisma.client.js';

export class OrganizationRepository {
  async findById(id: string) {
    return db.organization.findUnique({ where: { id } });
  }

  async create(data: any) {
    return db.organization.create({ data });
  }

  async update(id: string, data: any) {
    return db.organization.update({ where: { id }, data });
  }

  async countMemberships(orgId: string) {
    return db.organizationMembership.count({ where: { organizationId: orgId } });
  }

  async countLocations(orgId: string) {
    return db.location.count({ where: { organizationId: orgId } });
  }
}

export class LocationRepository {
  async findMany(orgId: string) {
    return db.location.findMany({ where: { organizationId: orgId }, orderBy: { name: 'asc' } });
  }

  async findById(orgId: string, id: string) {
    return db.location.findFirst({ where: { id, organizationId: orgId } });
  }

  async create(data: any) {
    return db.location.create({ data });
  }

  async update(id: string, data: any) {
    return db.location.update({ where: { id }, data });
  }

  async delete(id: string) {
    return db.location.delete({ where: { id } });
  }
}

export class OnboardingRepository {
  async findManyByUser(userId: string) {
    return db.onboardingStatus.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  async findUnique(userId: string, tourStepId: string) {
    return db.onboardingStatus.findUnique({
      where: { userId_tourStepId: { userId, tourStepId } },
    });
  }

  async create(data: any) {
    return db.onboardingStatus.create({ data });
  }
}

export class MembershipRepository {
  async findByUser(orgId: string, userId: string) {
    return db.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
  }

  async findMany(orgId: string) {
    return db.organizationMembership.findMany({
      where: { organizationId: orgId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(data: any) {
    return db.organizationMembership.create({ data });
  }

  async upsert(orgId: string, userId: string, data: any) {
    return db.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      create: {
        organizationId: orgId,
        userId,
        ...data,
      },
      update: data,
    });
  }

  async delete(orgId: string, userId: string) {
    return db.organizationMembership.delete({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
  }
}

export class GoalRepository {
  async findMany(orgId: string, userId: string) {
    return db.goal.findMany({ where: { organizationId: orgId, userId }, orderBy: { createdAt: 'desc' } });
  }

  async findById(orgId: string, userId: string, id: string) {
    return db.goal.findFirst({ where: { id, organizationId: orgId, userId } });
  }

  async create(data: any) {
    return db.goal.create({ data });
  }

  async update(id: string, data: any) {
    return db.goal.update({ where: { id }, data });
  }

  async delete(id: string) {
    return db.goal.delete({ where: { id } });
  }
}

export class HabitRepository {
  async findMany(orgId: string, userId: string) {
    return db.habit.findMany({ where: { organizationId: orgId, userId }, orderBy: { createdAt: 'desc' } });
  }

  async findById(orgId: string, userId: string, id: string) {
    return db.habit.findFirst({ where: { id, organizationId: orgId, userId } });
  }

  async create(data: any) {
    return db.habit.create({ data });
  }

  async update(id: string, data: any) {
    return db.habit.update({ where: { id }, data });
  }

  async delete(id: string) {
    return db.habit.delete({ where: { id } });
  }
}
