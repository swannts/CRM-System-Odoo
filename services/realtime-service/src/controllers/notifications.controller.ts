import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/identity.js';

export class NotificationsController {
  async list(req: AuthenticatedRequest, res: Response) {
    return res.json({ data: [], total: 0 });
  }

  async total(req: AuthenticatedRequest, res: Response) {
    return res.json({ data: { all: 0, unread: 0, archived: 0, categories: [] } });
  }

  async read(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true });
  }

  async archive(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true });
  }

  async unarchive(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true });
  }

  async markSeen(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true });
  }
}
