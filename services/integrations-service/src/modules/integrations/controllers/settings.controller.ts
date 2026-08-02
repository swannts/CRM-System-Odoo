import { Response } from 'express';

import { AuthenticatedRequest } from '../../../middleware/identity.js';
import {
  MetaIntegrationService,
  UserIntegrationSettingsService,
  VoiceIntegrationService,
} from '../services/index.js';

export class UserIntegrationSettingsController {
  private svc = new UserIntegrationSettingsService();

  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await this.svc.getSettings(req.identity.userId);
      return res.json({ success: true, data: settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await this.svc.updateSettings(req.identity.userId, req.body);
      return res.json({ success: true, data: settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class MetaIntegrationController {
  private svc = new MetaIntegrationService();

  async getIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getIntegration(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.updateIntegration(req.identity.userId, req.identity.orgId, req.body);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class VoiceIntegrationController {
  private svc = new VoiceIntegrationService();

  async getIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getIntegration(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.updateIntegration(req.identity.userId, req.identity.orgId, req.body);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
