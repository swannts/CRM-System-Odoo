import test from "node:test";
import assert from "node:assert/strict";
import { SequenceService } from "../../src/modules/sequences/sequence.service.js";

test("enroll creates enrollment and schedules first step", async () => {
  const calls: any = { activityCreate: 0 };
  const db: any = {
    emailSequence: {
      findFirst: async () => ({ id: "s1", orgId: "o1", isActive: true, steps: [{ stepNumber: 1, type: "email", delayDays: 0, templateId: "t1" }] }),
      update: async () => ({}),
    },
    emailTemplate: { findMany: async () => [{ id: "t1" }] },
    sequenceEnrollment: {
      findFirst: async () => null,
      create: async () => ({ id: "e1", orgId: "o1", sequenceId: "s1", status: "active", currentStep: 0 }),
      findUnique: async () => ({ id: "e1", orgId: "o1", status: "active", currentStep: 0, sequence: { steps: [{ stepNumber: 1, type: "email", delayDays: 0, templateId: "t1" }] } }),
    },
    sequenceActivity: {
      findFirst: async () => null,
      create: async () => {
        calls.activityCreate += 1;
      },
    },
  };

  const service = new SequenceService({ db });
  const enrollment = await service.enrollContact({ orgId: "o1", sequenceId: "s1", contactEmail: "x@example.com" });
  assert.equal(enrollment.id, "e1");
  assert.equal(calls.activityCreate, 1);
});

test("enroll prevents duplicate active enrollment", async () => {
  const db: any = {
    emailSequence: { findFirst: async () => ({ id: "s1", isActive: true }) },
    sequenceEnrollment: { findFirst: async () => ({ id: "dup" }) },
  };
  const service = new SequenceService({ db });
  await assert.rejects(() => service.enrollContact({ orgId: "o1", sequenceId: "s1", contactEmail: "x@example.com" }), /active enrollment/);
});

test("create sequence validates templates and steps", async () => {
  const db: any = {
    emailTemplate: { findMany: async () => [{ id: "t1" }] },
    emailSequence: { create: async (args: any) => args.data },
  };
  const service = new SequenceService({ db });
  const created = await service.createSequence({
    orgId: "o1",
    userId: "u1",
    name: "Seq",
    steps: [{ stepNumber: 1, type: "email", delayDays: 0, templateId: "t1" }],
  });
  assert.equal(created.totalDuration, 0);

  await assert.rejects(
    () => service.createSequence({ orgId: "o1", userId: "u1", name: "Bad", steps: [{ stepNumber: 2, type: "email", templateId: "t1" }] }),
    /contiguous/,
  );
});

test("processPendingActivities sends email step and advances", async () => {
  const sent: any[] = [];
  const updates: any[] = [];
  const db: any = {
    sequenceActivity: {
      findMany: async () => [
        { id: "a1", orgId: "o1", enrollmentId: "e1", stepNumber: 1, type: "email", scheduledAt: new Date(), enrollment: { id: "e1", orgId: "o1", status: "active", startedAt: new Date(Date.now() - 1000), contactEmail: "lead@example.com", dealId: null, contactId: null, firstName: "Sam", lastName: "K", companyName: "Acme", dealName: "Big Deal", sequence: { createdBy: "u1", steps: [{ stepNumber: 1, type: "email", templateId: "t1" }] } } },
      ],
      update: async (args: any) => updates.push(args),
      findFirst: async () => null,
      create: async () => ({}),
      updateMany: async () => ({}),
    },
    sequenceEnrollment: {
      update: async () => ({}),
      findUnique: async () => ({ id: "e1", orgId: "o1", status: "active", currentStep: 1, startedAt: new Date(Date.now() - 1000), contactEmail: "lead@example.com", sequence: { steps: [{ stepNumber: 1, type: "email", templateId: "t1" }] } }),
    },
    emailTemplate: {
      findUnique: async () => ({ id: "t1", subject: "Hi {{firstName}} {{lastName}}", body: "{{companyName}} {{email}} {{dealName}}" }),
    },
    email: {
      findFirst: async () => null,
    },
  };
  const mailService: any = { sendEmail: async (payload: any) => sent.push(payload) };

  const service = new SequenceService({ db, mailService });
  await service.processPendingActivities();

  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Hi Sam K");
  assert.equal(sent[0].body, "Acme lead@example.com Big Deal");
  assert.equal(updates[0].data.status, "sent");
});

test("pause/resume/cancel lifecycle", async () => {
  const statuses: string[] = [];
  const db: any = {
    sequenceEnrollment: {
      findFirst: async () => ({ id: "e1", orgId: "o1" }),
      findUnique: async () => ({ id: "e1", orgId: "o1", status: "paused", currentStep: 0, sequence: { steps: [{ stepNumber: 1, type: "wait" }] } }),
      update: async (args: any) => {
        statuses.push(args.data.status);
        return { id: "e1", ...args.data };
      },
    },
    sequenceActivity: {
      findFirst: async () => null,
      updateMany: async () => ({}),
      create: async () => ({}),
    },
  };

  const service = new SequenceService({ db });
  await service.pauseEnrollment("o1", "e1");
  await service.resumeEnrollment("o1", "e1");
  await service.cancelEnrollment("o1", "e1");
  assert.deepEqual(statuses, ["paused", "active", "cancelled"]);
});

test("reply/unsubscribe stop conditions", async () => {
  const updates: any[] = [];
  const db: any = {
    sequenceActivity: {
      findMany: async () => [
        { id: "a1", orgId: "o1", enrollmentId: "e1", stepNumber: 1, type: "wait", scheduledAt: new Date(), enrollment: { id: "e1", orgId: "o1", status: "active", startedAt: new Date(Date.now() - 2000), contactEmail: "lead@example.com", sequence: { createdBy: "u1", steps: [{ stepNumber: 1, type: "wait" }] } } },
      ],
      update: async (args: any) => updates.push(args),
      updateMany: async () => ({}),
      findFirst: async () => null,
    },
    sequenceEnrollment: {
      findUnique: async () => ({ id: "e1", orgId: "o1", status: "active", startedAt: new Date(Date.now() - 2000), contactEmail: "lead@example.com" }),
      update: async () => ({}),
      updateMany: async () => ({ count: 1 }),
    },
    email: {
      findFirst: async ({ where }: any) => (where.direction === "inbound" && where.fromEmail ? { id: "r1" } : null),
    },
  };

  const service = new SequenceService({ db });
  await service.processPendingActivities();
  assert.match(String(updates[0].data.errorMessage), /reply/i);

  const unsub = await service.unsubscribeByEmail("o1", "lead@example.com");
  assert.equal(unsub, 1);
});

test("track event updates activity and stops on bounce", async () => {
  const db: any = {
    sequenceEnrollment: {
      findFirst: async () => ({ id: "e1", orgId: "o1" }),
      update: async () => ({}),
    },
    sequenceActivity: {
      findFirst: async () => ({ id: "a1" }),
      update: async () => ({}),
      updateMany: async () => ({}),
    },
  };
  const service = new SequenceService({ db });
  const result = await service.trackEnrollmentEvent({ orgId: "o1", enrollmentId: "e1", event: "bounced", message: "hard bounce" });
  assert.equal(result.ok, true);
});

test("variable rendering supports expected placeholders", () => {
  const service = new SequenceService({});
  const rendered = service.renderVariables("{{firstName}} {{lastName}} {{companyName}} {{email}} {{dealName}}", {
    firstName: "A",
    lastName: "Z",
    companyName: "B",
    email: "c@example.com",
    dealName: "D",
  });
  assert.equal(rendered, "A Z B c@example.com D");
});
