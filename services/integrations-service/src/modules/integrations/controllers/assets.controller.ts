import { Response } from 'express';

import { AuthenticatedRequest } from '../../../middleware/auth.middleware.js';
import {
  ImageLibraryService,
  OdooIntegrationService,
} from '../services/index.js';

export class OdooController {
  private svc = new OdooIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { baseUrl, db, username, password, apiKey, isActive } = req.body;
      if (!baseUrl || !db || !username) {
        return res.status(400).json({ success: false, message: 'baseUrl, db, and username are required' });
      }

      const input = {
        baseUrl: String(baseUrl),
        db: String(db),
        username: String(username),
        ...(password !== undefined && { password: String(password) }),
        ...(apiKey !== undefined && { apiKey: String(apiKey) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      };

      const connection = await this.svc.connect(req.identity, input);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const connection = await this.svc.getConnection(req.identity.userId);
      return res.json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async disconnect(req: AuthenticatedRequest, res: Response) {
    try {
      await this.svc.disconnect(req.identity);
      return res.json({ success: true, message: 'Odoo disconnected' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getContacts(req: AuthenticatedRequest, res: Response) {
    try {
      const page = Number(req.query.page || 1);
      const pageSize = Number(req.query.pageSize || 50);
      const search = String(req.query.search || '');
      const data = await this.svc.getContacts(req.identity, page, pageSize, search);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getInvoices(req: AuthenticatedRequest, res: Response) {
    try {
      const page = Number(req.query.page || 1);
      const pageSize = Number(req.query.pageSize || 50);
      const data = await this.svc.getInvoices(req.identity, page, pageSize);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async syncMagento(req: AuthenticatedRequest, res: Response) {
    try {
      const { dryRun, limit, push } = req.body;
      const options = {
        ...(dryRun !== undefined && { dryRun: Boolean(dryRun) }),
        ...(limit !== undefined && { limit: Number(limit) }),
        ...(push !== undefined && { push: Boolean(push) }),
      };
      const data = await this.svc.syncMagento(req.identity, options);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class ImageLibraryController {
  private svc = new ImageLibraryService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const category = req.query.category ? String(req.query.category) : undefined;
      const limit = Number(req.query.limit || 200);
      const data = await this.svc.list(req.identity.orgId, category, limit);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, url, thumbnail, mimeType, size, category, tags } = req.body;

      if (!name || !url) {
        return res.status(400).json({ success: false, message: 'Image name and url are required' });
      }

      const payload = {
        name: String(name),
        url: String(url),
        thumbnail: thumbnail ? String(thumbnail) : undefined,
        mimeType: mimeType ? String(mimeType) : undefined,
        size: size ? Number(size) : undefined,
        category: category ? String(category) : undefined,
        tags: Array.isArray(tags) ? tags.map(String) : undefined,
      };

      const data = await this.svc.create(req.identity.userId, req.identity.orgId, payload);
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const data = await this.svc.remove(req.identity.orgId, id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}
