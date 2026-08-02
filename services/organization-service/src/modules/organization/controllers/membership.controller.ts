import { Response } from 'express';
import { MembershipService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class MembershipController {
  private svc = new MembershipService();

  async resolve(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.resolveMembership(req.identity.orgId, req.identity.userId);
      if (!data) return res.status(404).json({ message: 'Membership not found' });
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listMemberships(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.userId || req.body.userId || '').trim();
      if (!userId) return res.status(400).json({ message: 'userId is required' });

      const data = await this.svc.upsertMembership(
        req.identity.orgId,
        req.identity.userId,
        userId,
        req.body
      );

      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Invalid organization role') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.userId || '').trim();
      if (!userId) return res.status(400).json({ message: 'userId is required' });
      const data = await this.svc.removeMembership(req.identity.orgId, req.identity.userId, userId);
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Cannot remove the last organization owner') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }
}
