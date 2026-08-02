import { Response } from 'express';
import { CrmConfigurationService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class CrmConfigurationController {
  private svc = new CrmConfigurationService();

  async listTeams(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listTeams(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsertTeam(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = String(req.params.teamId || '').trim() || null;
      const data = await this.svc.upsertTeam(req.identity.orgId, req.identity.userId, teamId, req.body || {});
      return res.status(teamId ? 200 : 201).json({ data });
    } catch (err: any) {
      if (err.message === 'Team name is required') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async deleteTeam(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = String(req.params.teamId || '').trim();
      if (!teamId) return res.status(400).json({ message: 'teamId is required' });
      const data = await this.svc.deleteTeam(req.identity.orgId, req.identity.userId, teamId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async listPipelines(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listPipelines(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsertPipeline(req: AuthenticatedRequest, res: Response) {
    try {
      const pipelineId = String(req.params.pipelineId || '').trim() || null;
      const data = await this.svc.upsertPipeline(req.identity.orgId, req.identity.userId, pipelineId, req.body || {});
      return res.status(pipelineId ? 200 : 201).json({ data });
    } catch (err: any) {
      if (err.message === 'Pipeline name is required') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async deletePipeline(req: AuthenticatedRequest, res: Response) {
    try {
      const pipelineId = String(req.params.pipelineId || '').trim();
      if (!pipelineId) return res.status(400).json({ message: 'pipelineId is required' });
      const data = await this.svc.deletePipeline(req.identity.orgId, req.identity.userId, pipelineId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async listCustomFields(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listCustomFields(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsertCustomField(req: AuthenticatedRequest, res: Response) {
    try {
      const fieldId = String(req.params.fieldId || '').trim() || null;
      const data = await this.svc.upsertCustomField(req.identity.orgId, req.identity.userId, fieldId, req.body || {});
      return res.status(fieldId ? 200 : 201).json({ data });
    } catch (err: any) {
      if (err.message === 'Custom field name is required') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async deleteCustomField(req: AuthenticatedRequest, res: Response) {
    try {
      const fieldId = String(req.params.fieldId || '').trim();
      if (!fieldId) return res.status(400).json({ message: 'fieldId is required' });
      const data = await this.svc.deleteCustomField(req.identity.orgId, req.identity.userId, fieldId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getAutomationRules(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getAutomationRules(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async updateAutomationRules(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.updateAutomationRules(req.identity.orgId, req.identity.userId, req.body || {});
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
