import { Response } from 'express';
import { UserAccessService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class UserAccessController {
  private svc = new UserAccessService();

  async catalog(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getCatalog(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const search = String(req.query.search || '').trim();
      const data = await this.svc.listUsers(req.identity.orgId, req.identity.userId, search || undefined);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async keycloakUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const search = String(req.query.search || '').trim();
      const data = await this.svc.searchKeycloakUsers(req.identity.orgId, req.identity.userId, search || undefined);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createUser(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      if (err.message === 'email is required') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }

  async sync(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.userId || req.body.userId || '').trim();
      if (!userId) return res.status(400).json({ message: 'userId is required' });
      const data = await this.svc.syncKeycloak(req.identity.orgId, req.identity.userId, userId);
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Membership not found') {
        return res.status(404).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }
}
