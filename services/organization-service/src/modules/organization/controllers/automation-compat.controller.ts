import { Response } from 'express';
import { CrmConfigurationService, OrganizationService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class AutomationCompatController {
  private svc = new CrmConfigurationService();

  async insertFlowBeta(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.insertFlowBeta(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getFlowsBeta(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getFlowsBeta(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async addBetaChatbot(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.addBetaChatbot(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async insertWaCallFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.insertWaCallFlow(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async createTemplateCampaign(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createTemplateCampaign(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async dashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getBroadcastDashboard(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async createWaCallBroadcast(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createWaCallBroadcast(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async addTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.addTemplate(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async updateUserProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const orgSvc = new OrganizationService();
      const data = await orgSvc.updateUserProfile(req.identity.orgId, req.identity.userId, req.body || {});
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
