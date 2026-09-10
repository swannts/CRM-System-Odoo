import { db } from '../db.js';

/** A unique event key makes retries safe, including concurrent consumers. */
export async function recordNotification(input: {
  orgId: string; userId: string; eventId: string; title: string; body: string;
  type?: string; category?: string;
}) {
  return db.notification.upsert({
    where: { orgId_userId_eventId: { orgId: input.orgId, userId: input.userId, eventId: input.eventId } },
    create: input,
    update: {},
  });
}

/** Database polling also recovers reminders missed while the worker was offline. */
export async function deliverTaskReminders(now = new Date()) {
  let cursor: string | undefined;
  for (;;) {
    const tasks = await db.omniAgentTask.findMany({
      where: { dueAt: { lte: now }, status: { notIn: ['done', 'completed', 'cancelled'] } },
      orderBy: { id: 'asc' }, take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    for (const task of tasks) {
      await recordNotification({
        orgId: task.organizationId, userId: task.agentId,
        eventId: `task-due:${task.id}:${task.dueAt!.toISOString()}`,
        title: 'Task reminder', body: task.title, type: 'task', category: 'Tasks',
      });
    }
    if (tasks.length < 100) break;
    cursor = tasks[tasks.length - 1].id;
  }
}
