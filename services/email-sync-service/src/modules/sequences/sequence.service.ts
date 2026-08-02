import { prisma } from "../../database/prisma/prisma.client.js";
import { MailService } from "../../integrations/email/mail.service.js";

const defaultMailService = new MailService();

type SequenceStep = {
  stepNumber: number;
  type: "email" | "task" | "wait";
  delayDays?: number;
  templateId?: string;
};

const ACTIVE_STATUSES = ["active", "paused"] as const;

export class SequenceService {
  constructor(
    private readonly deps: {
      db?: typeof prisma;
      mailService?: MailService;
    } = {},
  ) {}

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private normalizeSteps(steps: unknown): SequenceStep[] {
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error("steps must be a non-empty array");
    }

    const normalized = steps.map((step: any, index: number) => {
      const stepNumber = Number(step?.stepNumber ?? index + 1);
      const type = step?.type;
      const delayDays = Number(step?.delayDays ?? 0);

      if (!Number.isInteger(stepNumber) || stepNumber <= 0) {
        throw new Error(`Invalid stepNumber at step ${index + 1}`);
      }
      if (!["email", "task", "wait"].includes(type)) {
        throw new Error(`Invalid step type at step ${index + 1}`);
      }
      if (!Number.isFinite(delayDays) || delayDays < 0 || delayDays > 365) {
        throw new Error(`Invalid delayDays at step ${index + 1}`);
      }
      if (type === "email" && !step?.templateId) {
        throw new Error(`templateId is required for email step ${stepNumber}`);
      }

      return {
        stepNumber,
        type,
        delayDays,
        templateId: step?.templateId,
      } as SequenceStep;
    });

    const stepNumbers = normalized.map((s) => s.stepNumber).sort((a, b) => a - b);
    for (let i = 0; i < stepNumbers.length; i += 1) {
      if (stepNumbers[i] !== i + 1) {
        throw new Error("stepNumber values must be contiguous starting at 1");
      }
    }

    return normalized.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  private async validateTemplates(orgId: string, steps: SequenceStep[]) {
    const db = this.deps.db ?? prisma;
    const templateIds = steps.filter((s) => s.type === "email").map((s) => s.templateId!).filter(Boolean);
    if (templateIds.length === 0) return;

    const templates = await db.emailTemplate.findMany({
      where: { orgId, id: { in: templateIds } },
      select: { id: true },
    });

    const existing = new Set(templates.map((t) => t.id));
    const missing = templateIds.filter((id) => !existing.has(id));
    if (missing.length > 0) {
      throw new Error(`Invalid template IDs: ${missing.join(", ")}`);
    }
  }

  private calcTotalDuration(steps: SequenceStep[]) {
    return steps.reduce((acc, s) => acc + (s.delayDays || 0), 0);
  }

  async listSequences(orgId: string) {
    const db = this.deps.db ?? prisma;
    return db.emailSequence.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSequence(orgId: string, sequenceId: string) {
    const db = this.deps.db ?? prisma;
    const sequence = await db.emailSequence.findFirst({
      where: { id: sequenceId, orgId },
    });
    if (!sequence) throw new Error("Sequence not found");
    return sequence;
  }

  async createSequence(params: { orgId: string; userId: string; name: string; description?: string; isActive?: boolean; steps: unknown }) {
    const db = this.deps.db ?? prisma;
    const { orgId, userId, name, description, isActive = true, steps } = params;

    if (!name || !name.trim()) throw new Error("name is required");

    const normalizedSteps = this.normalizeSteps(steps);
    await this.validateTemplates(orgId, normalizedSteps);

    return db.emailSequence.create({
      data: {
        orgId,
        createdBy: userId,
        name: name.trim(),
        description,
        isActive,
        steps: normalizedSteps,
        totalDuration: this.calcTotalDuration(normalizedSteps),
      },
    });
  }

  async updateSequence(params: { orgId: string; sequenceId: string; name?: string; description?: string | null; isActive?: boolean; steps?: unknown }) {
    const db = this.deps.db ?? prisma;
    const { orgId, sequenceId, name, description, isActive, steps } = params;

    const existing = await db.emailSequence.findFirst({ where: { id: sequenceId, orgId } });
    if (!existing) throw new Error("Sequence not found");

    let normalizedSteps: SequenceStep[] | undefined;
    if (steps !== undefined) {
      normalizedSteps = this.normalizeSteps(steps);
      await this.validateTemplates(orgId, normalizedSteps);
    }

    return db.emailSequence.update({
      where: { id: sequenceId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(normalizedSteps ? { steps: normalizedSteps, totalDuration: this.calcTotalDuration(normalizedSteps) } : {}),
      },
    });
  }

  async deleteSequence(orgId: string, sequenceId: string) {
    const db = this.deps.db ?? prisma;
    const existing = await db.emailSequence.findFirst({ where: { id: sequenceId, orgId } });
    if (!existing) throw new Error("Sequence not found");

    await db.sequenceActivity.deleteMany({ where: { enrollment: { sequenceId, orgId } } });
    await db.sequenceEnrollment.deleteMany({ where: { sequenceId, orgId } });
    await db.emailSequence.delete({ where: { id: sequenceId } });
    return { deleted: true };
  }

  async enrollContact(params: {
    orgId: string;
    sequenceId: string;
    contactEmail: string;
    contactId?: string;
    dealId?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    dealName?: string;
  }) {
    const db = this.deps.db ?? prisma;
    const { orgId, sequenceId, contactEmail, contactId, dealId, firstName, lastName, companyName, dealName } = params;
    const normalizedEmail = contactEmail.toLowerCase().trim();

    const sequence = await db.emailSequence.findFirst({ where: { id: sequenceId, orgId, isActive: true } });
    if (!sequence) throw new Error("Sequence not found or inactive");

    if (!this.isValidEmail(normalizedEmail)) {
      throw new Error("Invalid contact email");
    }

    const duplicate = await db.sequenceEnrollment.findFirst({
      where: {
        orgId,
        sequenceId,
        contactEmail: normalizedEmail,
        status: { in: [...ACTIVE_STATUSES] },
      },
    });
    if (duplicate) {
      throw new Error("Contact already has an active enrollment in this sequence");
    }

    const enrollment = await db.sequenceEnrollment.create({
      data: {
        orgId,
        sequenceId,
        contactEmail: normalizedEmail,
        contactId,
        dealId,
        firstName,
        lastName,
        companyName,
        dealName,
        status: "active",
        currentStep: 0,
      },
    });

    await db.emailSequence.update({ where: { id: sequenceId }, data: { enrollmentCount: { increment: 1 } } });
    await this.scheduleNextStep(enrollment.id);
    return enrollment;
  }

  async listEnrollments(orgId: string, sequenceId: string) {
    const db = this.deps.db ?? prisma;
    return db.sequenceEnrollment.findMany({
      where: { orgId, sequenceId },
      orderBy: { startedAt: "desc" },
      include: {
        activities: { orderBy: { scheduledAt: "asc" } },
      },
    });
  }

  async getEnrollment(orgId: string, enrollmentId: string) {
    const db = this.deps.db ?? prisma;
    const enrollment = await db.sequenceEnrollment.findFirst({
      where: { id: enrollmentId, orgId },
      include: { sequence: true, activities: { orderBy: { scheduledAt: "asc" } } },
    });
    if (!enrollment) throw new Error("Enrollment not found");
    return enrollment;
  }

  async getEnrollmentTimeline(orgId: string, enrollmentId: string) {
    return this.getEnrollment(orgId, enrollmentId);
  }

  async getEnrollmentStatus(orgId: string, enrollmentId: string) {
    const enrollment = await this.getEnrollment(orgId, enrollmentId);

    const totalSteps = Array.isArray(enrollment.sequence.steps) ? enrollment.sequence.steps.length : 0;
    const sentCount = enrollment.activities.filter((a) => a.status === "sent").length;
    const failedCount = enrollment.activities.filter((a) => a.status === "failed").length;
    const pendingCount = enrollment.activities.filter((a) => a.status === "pending").length;
    const openedCount = enrollment.activities.filter((a) => a.status === "opened").length;
    const clickedCount = enrollment.activities.filter((a) => a.status === "clicked").length;
    const bouncedCount = enrollment.activities.filter((a) => a.status === "bounced").length;
    const repliedCount = enrollment.activities.filter((a) => a.status === "replied").length;
    const progressPct = totalSteps > 0 ? Math.round((sentCount / totalSteps) * 100) : 0;
    const nextActivity = enrollment.activities
      .filter((a) => a.status === "pending")
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];

    return {
      enrollmentId: enrollment.id,
      sequenceId: enrollment.sequenceId,
      sequenceName: enrollment.sequence.name,
      status: enrollment.status,
      contactEmail: enrollment.contactEmail,
      currentStep: enrollment.currentStep,
      totalSteps,
      progressPct,
      counts: {
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
        opened: openedCount,
        clicked: clickedCount,
        replied: repliedCount,
        bounced: bouncedCount,
      },
      stopReason: ["unsubscribed", "replied", "cancelled", "bounced"].includes(enrollment.status) ? enrollment.status : null,
      timeline: enrollment.activities.map((a) => ({
        id: a.id,
        stepNumber: a.stepNumber,
        type: a.type,
        status: a.status,
        scheduledAt: a.scheduledAt,
        sentAt: a.sentAt,
        openedAt: a.openedAt,
        clickedAt: a.clickedAt,
        errorMessage: a.errorMessage,
      })),
      nextActivity: nextActivity
        ? {
            id: nextActivity.id,
            stepNumber: nextActivity.stepNumber,
            type: nextActivity.type,
            scheduledAt: nextActivity.scheduledAt,
          }
        : null,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
      unsubscribedAt: enrollment.unsubscribedAt,
    };
  }

  async pauseEnrollment(orgId: string, enrollmentId: string) {
    return this.setEnrollmentStatus(orgId, enrollmentId, "paused");
  }

  async resumeEnrollment(orgId: string, enrollmentId: string) {
    const db = this.deps.db ?? prisma;
    const enrollment = await db.sequenceEnrollment.findFirst({ where: { id: enrollmentId, orgId } });
    if (!enrollment) throw new Error("Enrollment not found");

    const updated = await db.sequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: "active" } });
    const existingPending = await db.sequenceActivity.findFirst({
      where: { enrollmentId: enrollment.id, status: "pending" },
    });
    if (!existingPending) {
      await this.scheduleNextStep(enrollment.id);
    }
    return updated;
  }

  async cancelEnrollment(orgId: string, enrollmentId: string) {
    const db = this.deps.db ?? prisma;
    const enrollment = await this.setEnrollmentStatus(orgId, enrollmentId, "cancelled", true);
    await db.sequenceActivity.updateMany({
      where: { enrollmentId, status: "pending" },
      data: { status: "failed", errorMessage: "Enrollment cancelled" },
    });
    return enrollment;
  }

  async trackEnrollmentEvent(params: { orgId: string; enrollmentId: string; event: "sent" | "failed" | "opened" | "clicked" | "replied" | "bounced" | "unsubscribe"; message?: string }) {
    const db = this.deps.db ?? prisma;
    const enrollment = await db.sequenceEnrollment.findFirst({ where: { id: params.enrollmentId, orgId: params.orgId } });
    if (!enrollment) throw new Error("Enrollment not found");

    const latestActivity = await db.sequenceActivity.findFirst({
      where: { enrollmentId: enrollment.id },
      orderBy: { scheduledAt: "desc" },
    });

    if (latestActivity) {
      const data: any = {};
      if (params.event === "opened") data.openedAt = new Date();
      if (params.event === "clicked") data.clickedAt = new Date();
      if (params.event === "failed") {
        data.status = "failed";
        data.errorMessage = params.message || "Delivery failed";
      }
      if (params.event === "sent") data.status = "sent";
      if (params.event === "bounced") {
        data.status = "bounced";
        data.errorMessage = params.message || "Email bounced";
      }
      if (params.event === "replied") {
        data.status = "replied";
      }
      if (Object.keys(data).length > 0) {
        await db.sequenceActivity.update({ where: { id: latestActivity.id }, data });
      }
    }

    if (params.event === "replied") {
      await this.stopEnrollmentAs(enrollment.id, "replied", "Stopped after contact reply");
    } else if (params.event === "bounced") {
      await this.stopEnrollmentAs(enrollment.id, "bounced", params.message || "Stopped after bounce");
    } else if (params.event === "unsubscribe") {
      await this.setEnrollmentStatus(params.orgId, enrollment.id, "unsubscribed", true);
      await db.sequenceActivity.updateMany({
        where: { enrollmentId: enrollment.id, status: "pending" },
        data: { status: "failed", errorMessage: "Contact unsubscribed" },
      });
    }

    return { ok: true };
  }

  async unsubscribeByEmail(orgId: string, email: string) {
    const db = this.deps.db ?? prisma;
    const normalizedEmail = email.toLowerCase();

    const result = await db.sequenceEnrollment.updateMany({
      where: { orgId, contactEmail: normalizedEmail, status: { in: ["active", "paused"] } },
      data: { status: "unsubscribed", unsubscribedAt: new Date(), completedAt: new Date() },
    });

    await db.sequenceActivity.updateMany({
      where: {
        orgId,
        status: "pending",
        enrollment: { contactEmail: normalizedEmail },
      },
      data: { status: "failed", errorMessage: "Contact unsubscribed" },
    });

    return result.count;
  }

  async scheduleNextStep(enrollmentId: string) {
    const db = this.deps.db ?? prisma;
    const enrollment = await db.sequenceEnrollment.findUnique({ where: { id: enrollmentId }, include: { sequence: true } });
    if (!enrollment || enrollment.status !== "active") return;

    const steps = enrollment.sequence.steps as unknown as SequenceStep[];
    const nextStepIndex = enrollment.currentStep;
    if (nextStepIndex >= steps.length) {
      await db.sequenceEnrollment.update({ where: { id: enrollmentId }, data: { status: "completed", completedAt: new Date() } });
      return;
    }

    const step = steps[nextStepIndex];
    const existingPending = await db.sequenceActivity.findFirst({ where: { enrollmentId, status: "pending", stepNumber: step.stepNumber } });
    if (existingPending) return;

    const scheduledAt = new Date();
    if (step.delayDays) scheduledAt.setDate(scheduledAt.getDate() + step.delayDays);

    await db.sequenceActivity.create({
      data: {
        orgId: enrollment.orgId,
        enrollmentId: enrollment.id,
        stepNumber: step.stepNumber,
        type: step.type,
        status: "pending",
        scheduledAt,
      },
    });
  }

  async processPendingActivities() {
    const db = this.deps.db ?? prisma;
    const now = new Date();
    const pendingActivities = await db.sequenceActivity.findMany({
      where: { status: "pending", scheduledAt: { lte: now } },
      include: { enrollment: { include: { sequence: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    for (const activity of pendingActivities) {
      try {
        if (activity.enrollment.status !== "active") {
          await db.sequenceActivity.update({ where: { id: activity.id }, data: { status: "failed", errorMessage: `Enrollment ${activity.enrollment.status}` } });
          continue;
        }

        if (!this.isValidEmail(activity.enrollment.contactEmail)) {
          await this.setEnrollmentStatus(activity.enrollment.orgId, activity.enrollment.id, "cancelled", true);
          await db.sequenceActivity.update({ where: { id: activity.id }, data: { status: "failed", errorMessage: "Invalid contact email" } });
          continue;
        }

        const stop = await this.resolveStopCondition(activity.enrollment.orgId, activity.enrollment.id);
        if (stop.shouldStop) {
          await this.stopEnrollmentAs(activity.enrollment.id, stop.status, stop.reason);
          await db.sequenceActivity.update({ where: { id: activity.id }, data: { status: "failed", errorMessage: stop.reason } });
          continue;
        }

        if (activity.type === "email") {
          await this.executeEmailStep(activity);
        }

        await db.sequenceActivity.update({ where: { id: activity.id }, data: { status: "sent", sentAt: new Date() } });
        await db.sequenceEnrollment.update({ where: { id: activity.enrollmentId }, data: { currentStep: { increment: 1 } } });
        await this.scheduleNextStep(activity.enrollmentId);
      } catch (error: any) {
        await db.sequenceActivity.update({ where: { id: activity.id }, data: { status: "failed", errorMessage: error.message } });
      }
    }
  }

  private async executeEmailStep(activity: any) {
    const db = this.deps.db ?? prisma;
    const mailService = this.deps.mailService ?? defaultMailService;

    const steps = activity.enrollment.sequence.steps as SequenceStep[];
    const step = steps.find((s) => s.stepNumber === activity.stepNumber);
    if (!step || !step.templateId) throw new Error("Invalid email step configuration");

    const template = await db.emailTemplate.findUnique({ where: { id: step.templateId } });
    if (!template) throw new Error(`Template ${step.templateId} not found`);

    const vars = {
      firstName: activity.enrollment.firstName,
      lastName: activity.enrollment.lastName,
      companyName: activity.enrollment.companyName,
      email: activity.enrollment.contactEmail,
      dealName: activity.enrollment.dealName,
    };

    const renderedSubject = this.renderVariables(template.subject, vars);
    const renderedBody = this.renderVariables(template.body, vars);

    await mailService.sendEmail({
      orgId: activity.orgId,
      userId: activity.enrollment.sequence.createdBy,
      to: activity.enrollment.contactEmail,
      subject: renderedSubject,
      body: renderedBody,
      isHtml: true,
      relatedDealId: activity.enrollment.dealId || undefined,
      relatedContactId: activity.enrollment.contactId || undefined,
    });
  }

  renderVariables(template: string, vars: Record<string, string | undefined>) {
    return template.replace(/{{\s*(firstName|lastName|companyName|email|dealName)\s*}}/g, (_, key: string) => vars[key] || "");
  }

  private async resolveStopCondition(orgId: string, enrollmentId: string) {
    const db = this.deps.db ?? prisma;
    const enrollment = await db.sequenceEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return { shouldStop: true, status: "cancelled" as const, reason: "Enrollment not found" };

    if (enrollment.status === "cancelled") return { shouldStop: true, status: "cancelled" as const, reason: "Stopped manually" };
    if (enrollment.status === "unsubscribed") return { shouldStop: true, status: "unsubscribed" as const, reason: "Stopped after unsubscribe" };

    const reply = await db.email.findFirst({
      where: {
        orgId,
        direction: "inbound",
        fromEmail: enrollment.contactEmail.toLowerCase(),
        sentAt: { gte: enrollment.startedAt },
      },
    });
    if (reply) return { shouldStop: true, status: "replied" as const, reason: "Stopped after contact reply" };

    const bounce = await db.email.findFirst({
      where: {
        orgId,
        direction: "inbound",
        sentAt: { gte: enrollment.startedAt },
        OR: [
          { fromEmail: { contains: "mailer-daemon" } },
          { subject: { contains: "undeliver" } },
          { labels: { hasSome: ["BOUNCE", "bounced", "bounce"] } },
        ],
      },
    });

    if (bounce) return { shouldStop: true, status: "bounced" as const, reason: "Stopped after bounce" };

    return { shouldStop: false, status: "active" as const, reason: "" };
  }

  private async stopEnrollmentAs(enrollmentId: string, status: "replied" | "unsubscribed" | "cancelled" | "bounced", reason: string) {
    const db = this.deps.db ?? prisma;
    await db.sequenceEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        completedAt: new Date(),
        ...(status === "unsubscribed" ? { unsubscribedAt: new Date() } : {}),
      },
    });

    await db.sequenceActivity.updateMany({
      where: { enrollmentId, status: "pending" },
      data: { status: "failed", errorMessage: reason },
    });
  }

  private async setEnrollmentStatus(orgId: string, enrollmentId: string, status: string, markComplete = false) {
    const db = this.deps.db ?? prisma;
    const enrollment = await db.sequenceEnrollment.findFirst({ where: { id: enrollmentId, orgId } });
    if (!enrollment) throw new Error("Enrollment not found");

    return db.sequenceEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status,
        ...(status === "unsubscribed" ? { unsubscribedAt: new Date() } : {}),
        ...(markComplete ? { completedAt: new Date() } : {}),
      },
    });
  }
}
