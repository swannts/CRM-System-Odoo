import { Response } from 'express';

import { getRouteParam } from '../../../common/utils/route-param.js';
import { AuthenticatedRequest } from '../../../middleware/identity.js';
import {
  TelegramService,
  WebhookService,
  WhatsAppService,
} from '../services/index.js';

export class WhatsAppController {
  private svc = new WhatsAppService();

  async getInstances(req: AuthenticatedRequest, res: Response) {
    try {
      const instances = await this.svc.getInstances(req.identity.userId);
      return res.json({ success: true, data: instances });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createInstance(req: AuthenticatedRequest, res: Response) {
    try {
      const { name } = req.body;
      const instance = await this.svc.createInstance(req.identity.userId, req.identity.orgId, name);
      return res.status(201).json({ success: true, data: instance });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteInstance(req: AuthenticatedRequest, res: Response) {
    try {
      const instanceId = getRouteParam(req.params.instanceId);
      await this.svc.deleteInstance(instanceId);
      return res.json({ success: true, message: 'Instance deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getQr(req: AuthenticatedRequest, res: Response) {
    try {
      const instanceId = getRouteParam(req.params.instanceId);
      const instance = await this.svc.getInstance(instanceId);
      if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
      return res.json({ success: true, data: { qr: instance.qr, status: instance.status } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const instanceId = getRouteParam(req.params.instanceId);
      const instance = await this.svc.getInstance(instanceId);
      if (!instance) return res.status(404).json({ success: false, message: 'Instance not found' });
      return res.json({
        success: true,
        data: {
          instanceId: instance.instanceId,
          status: instance.status,
          phone: instance.phone,
          updatedAt: instance.updatedAt,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class TelegramController {
  private svc = new TelegramService();

  async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const sessions = await this.svc.getSessions(req.identity.userId);
      return res.json({ success: true, data: sessions });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { name } = req.body;
      const session = await this.svc.createSession(req.identity.userId, req.identity.orgId, name);
      return res.status(201).json({ success: true, data: session });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteSession(req: AuthenticatedRequest, res: Response) {
    try {
      const sessionId = getRouteParam(req.params.sessionId);
      await this.svc.deleteSession(sessionId);
      return res.json({ success: true, message: 'Session deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const phone = String(req.body?.phone || req.body?.mobile || '').trim();
      if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });
      const data = await this.svc.sendOtp(req.identity.userId, req.identity.orgId, phone);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async verifyOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const phone = String(req.body?.phone || req.body?.mobile || '').trim();
      const otp = String(req.body?.otp || req.body?.code || '').trim();
      if (!phone || !otp) return res.status(400).json({ success: false, message: 'phone and otp are required' });
      const data = await this.svc.verifyOtp(req.identity.orgId, phone, otp);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

export class WebhookController {
  private svc = new WebhookService();

  async verifyMeta(req: any, res: Response) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      const result = await this.svc.verifyMetaWebhook(mode, token, challenge);
      return res.send(result);
    } catch (err: any) {
      return res.status(403).send('Forbidden');
    }
  }

  async handleMeta(req: any, res: Response) {
    try {
      await this.svc.handleMetaWebhook(req.body, req.logger);
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err: any) {
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  async handleTelegram(req: any, res: Response) {
    try {
      await this.svc.handleTelegramWebhook(req.body, req.logger, req.params?.sessionId);
      return res.json({ success: true });
    } catch (err: any) {
      return res.json({ success: true });
    }
  }
}
