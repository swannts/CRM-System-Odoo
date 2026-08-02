import { Response } from 'express';

import { getRouteParam } from '../../../shared/utils/route-param.js';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware.js';
import {
  GoogleIntegrationService,
  IntegrationConnectionService,
  ZoomIntegrationService,
} from '../services/index.js';

export class IntegrationController {
  private connSvc = new IntegrationConnectionService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider, accessToken, refreshToken, expiresAt, tokenType, scope, accountId, accountName } = req.body;
      if (!provider || !accessToken) return res.status(400).json({ success: false, message: 'Provider and accessToken required' });

      const connection = await this.connSvc.connect(
        { provider, accessToken, refreshToken, expiresAt, tokenType, scope, accountId, accountName },
        req.identity.userId,
        req.identity.orgId
      );
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnections(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider } = req.query;
      const connections = await this.connSvc.getConnections(req.identity.orgId, provider as string);
      return res.json({ success: true, data: connections });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async disconnect(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider } = req.body;
      if (!provider) return res.status(400).json({ success: false, message: 'Provider is required' });

      await this.connSvc.disconnect(req.identity.userId, provider);
      return res.json({ success: true, message: 'Disconnected' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class GoogleController {
  private svc = new GoogleIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, refreshToken, expiresAt } = req.body;
      const integration = await this.svc.connect(req.identity.userId, req.identity.orgId, { accessToken, refreshToken, expiresAt, isConnected: true });
      return res.status(201).json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getConnection(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getReviews(req: AuthenticatedRequest, res: Response) {
    const reviews = await this.svc.getReviews(req.identity.userId);
    return res.json({ success: true, data: reviews });
  }

  async getSecret(req: AuthenticatedRequest, res: Response) {
    const secret = await this.svc.getSecret(req.identity.userId);
    return res.json({ success: true, data: secret });
  }
}

export class ZoomController {
  private svc = new ZoomIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, refreshToken, expiresAt, accountId } = req.body;
      const integration = await this.svc.connect(req.identity.userId, req.identity.orgId, { accessToken, refreshToken, expiresAt, accountId, isConnected: true });
      return res.status(201).json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const integration = await this.svc.getConnection(req.identity.userId);
      return res.json({ success: true, data: integration });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { topic, startTime, duration, joinUrl, password } = req.body;
      if (!topic || !startTime) return res.status(400).json({ success: false, message: 'Topic and startTime required' });

      const meeting = await this.svc.createMeeting(
        { zoomId: '', topic, startTime: new Date(startTime), duration, joinUrl, password },
        req.identity.userId,
        req.identity.orgId
      );
      return res.status(201).json({ success: true, data: meeting });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMeetings(req: AuthenticatedRequest, res: Response) {
    try {
      const meetings = await this.svc.getMeetings(req.identity.userId);
      return res.json({ success: true, data: meetings });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId, ...data } = req.body;
      const meeting = await this.svc.updateMeeting(meetingId, data);
      return res.json({ success: true, data: meeting });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const meetingId = getRouteParam(req.params.meetingId);
      await this.svc.deleteMeeting(meetingId);
      return res.json({ success: true, message: 'Meeting deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    const user = await this.svc.getCurrentUser('');
    return res.json({ success: true, data: user });
  }

  async generateSignature(req: AuthenticatedRequest, res: Response) {
    try {
      const { meetingId, role } = req.body;
      const signature = await this.svc.generateSignature(meetingId, role);
      return res.json({ success: true, data: signature });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async isProfileExists(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: { exists: false } });
  }

  async getCredentials(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: {} });
  }
}
