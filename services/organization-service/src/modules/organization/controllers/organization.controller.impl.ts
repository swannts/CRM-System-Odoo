import { Response } from 'express';
import { OrganizationService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class OrganizationController {
  private organizationService = new OrganizationService();

  async get(req: AuthenticatedRequest, res: Response) {
    try {
      const org = await this.organizationService.getOrganization(req.identity.orgId, req.identity.userId);
      return res.json({ data: org });
    } catch (err: any) {
      if (err.message === 'Organization not found') return res.status(404).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const org = await this.organizationService.updateOrganization(req.identity.orgId, req.identity.userId, req.body || {});
      return res.json({ data: org });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async workspace(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.organizationService.getWorkspace(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const section = String(req.params.section || '').trim();
      const data = await this.organizationService.getSettingsSection(req.identity.orgId, req.identity.userId, section);
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Unknown settings section') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const section = String(req.params.section || '').trim();
      const data = await this.organizationService.updateSettingsSection(req.identity.orgId, req.identity.userId, section, req.body || {});
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Unknown settings section') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }
}
