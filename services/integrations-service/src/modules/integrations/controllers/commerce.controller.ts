import { Response } from 'express';

import { AuthenticatedRequest } from '../../../middleware/identity.js';
import {
  EasyPostIntegrationService,
  MagentoIntegrationService,
  ShopifyIntegrationService,
  UberEatsIntegrationService,
} from '../services/index.js';

export class ShopifyController {
  private svc = new ShopifyIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { shopDomain, accessToken } = req.body;
      if (!shopDomain || !accessToken) return res.status(400).json({ success: false, message: 'shopDomain and accessToken required' });

      const store = await this.svc.connect(req.identity.userId, req.identity.orgId, { shopDomain, isActive: true }, accessToken);
      return res.status(201).json({ success: true, data: store });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStores(req: AuthenticatedRequest, res: Response) {
    try {
      const stores = await this.svc.getStores(req.identity.userId);
      return res.json({ success: true, data: stores });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const { storeId } = req.query;
      const products = await this.svc.getProducts(storeId as string);
      return res.json({ success: true, data: products });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class MagentoController {
  private svc = new MagentoIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { baseUrl, accessToken, username, password, storeCode } = req.body;
      if (!baseUrl) {
        return res.status(400).json({ success: false, message: 'baseUrl is required' });
      }

      const connection = await this.svc.connect(req.identity, {
        baseUrl,
        accessToken,
        username,
        password,
        storeCode,
        isActive: true,
      });
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
      return res.json({ success: true, message: 'Magento disconnected' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStores(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getStores(req.identity);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const pageSize = Number(req.query.pageSize || 50);
      const currentPage = Number(req.query.currentPage || 1);
      const search = String(req.query.search || '');
      const data = await this.svc.getProducts(req.identity, pageSize, currentPage, search);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const pageSize = Number(req.query.pageSize || 50);
      const currentPage = Number(req.query.currentPage || 1);
      const data = await this.svc.getOrders(req.identity, pageSize, currentPage);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const pageSize = Number(req.query.pageSize || 50);
      const currentPage = Number(req.query.currentPage || 1);
      const data = await this.svc.getCustomers(req.identity, pageSize, currentPage);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class UberEatsController {
  private svc = new UberEatsIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { storeId, accessToken, refreshToken } = req.body;
      const config = await this.svc.connect(req.identity.userId, req.identity.orgId, { storeId, accessToken, refreshToken, isActive: true });
      return res.status(201).json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const orders = await this.svc.getOrders(req.identity.userId);
      return res.json({ success: true, data: orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class EasyPostController {
  private svc = new EasyPostIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ success: false, message: 'apiKey required' });

      const config = await this.svc.connect(req.identity.userId, req.identity.orgId, apiKey);
      return res.status(201).json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createShipment(req: AuthenticatedRequest, res: Response) {
    try {
      const shipment = await this.svc.createShipment(req.identity.userId, req.body);
      return res.status(201).json({ success: true, data: shipment });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRates(req: AuthenticatedRequest, res: Response) {
    try {
      const rates = await this.svc.getRates(req.identity.userId, req.body);
      return res.json({ success: true, data: rates });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
