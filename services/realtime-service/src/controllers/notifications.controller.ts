import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/identity.js';
import { db } from '../db.js';

export class NotificationsController {
  private scope(req: AuthenticatedRequest) {
    return { orgId: req.identity.orgId, userId: req.identity.userId };
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const where = {
        ...this.scope(req),
        isArchived: req.query.archived === 'true',
        ...(req.query.unread === 'true' ? { isRead: false } : {}),
      };
      const [data, total] = await db.$transaction([
        db.notification.findMany({ where, take: Math.floor(limit), skip: Math.floor(offset), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
        db.notification.count({ where }),
      ]);
      return res.json({ data, total });
    } catch {
      return res.status(503).json({ message: 'Notifications are temporarily unavailable.' });
    }
  }

  async total(req: AuthenticatedRequest, res: Response) {
    try {
      const scope = this.scope(req);
      const [all, unread, archived, groups] = await db.$transaction([
        db.notification.count({ where: { ...scope, isArchived: false } }),
        db.notification.count({ where: { ...scope, isArchived: false, isRead: false } }),
        db.notification.count({ where: { ...scope, isArchived: true } }),
        db.notification.groupBy({ by: ['category'], where: { ...scope, isArchived: false }, _count: { _all: true } }),
      ]);
      return res.json({ data: { all, unread, archived, categories: groups.map(group => ({ category: group.category, count: group._count._all })) } });
    } catch {
      return res.status(503).json({ message: 'Notification counts are temporarily unavailable.' });
    }
  }

  private async mutate(req: AuthenticatedRequest, res: Response, data: { isRead?: boolean; isSeen?: boolean; isArchived?: boolean }) {
    const ids = req.body?.ids;
    // The existing UI sends [] for bulk actions on all of this recipient's records.
    if (!Array.isArray(ids) || ids.length > 100 || ids.some(id => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
      return res.status(400).json({ message: 'ids must contain at most 100 notification UUIDs.' });
    }
    try {
      const result = await db.notification.updateMany({
        where: { ...this.scope(req), ...(ids.length ? { id: { in: ids } } : {}) }, data,
      });
      return res.json({ success: true, updated: result.count });
    } catch {
      return res.status(503).json({ message: 'Unable to update notifications.' });
    }
  }

  read(req: AuthenticatedRequest, res: Response) { return this.mutate(req, res, { isRead: true, isSeen: true }); }
  archive(req: AuthenticatedRequest, res: Response) { return this.mutate(req, res, { isArchived: true }); }
  unarchive(req: AuthenticatedRequest, res: Response) { return this.mutate(req, res, { isArchived: false }); }
  markSeen(req: AuthenticatedRequest, res: Response) {
    if (req.params.userId && req.params.userId !== req.identity.userId) {
      return res.status(403).json({ message: 'Cannot update another recipient.' });
    }
    req.body = { ids: [req.params.id] };
    return this.mutate(req, res, { isSeen: true });
  }
}
