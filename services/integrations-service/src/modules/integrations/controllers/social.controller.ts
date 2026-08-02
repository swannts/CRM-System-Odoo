import { Response } from 'express';

import { AuthenticatedRequest } from '../../../middleware/identity.js';
import {
  FacebookIntegrationService,
  InstagramIntegrationService,
  LinkedInIntegrationService,
  TikTokIntegrationService,
} from '../services/index.js';

export class FacebookController {
  private svc = new FacebookIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, pageId, pageName } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, pageId, pageName);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPages(req: AuthenticatedRequest, res: Response) {
    const pages = await this.svc.getPages(req.identity.userId);
    return res.json({ success: true, data: pages });
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { message, mediaUrls } = req.body;
      const post = await this.svc.createPost(req.identity.userId, message, mediaUrls);
      return res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCampaignsInsights(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: {} });
  }
}

export class InstagramController {
  private svc = new InstagramIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, accountId } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, accountId);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { imageUrl, caption } = req.body;
      const post = await this.svc.createPost(req.identity.userId, imageUrl, caption);
      return res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getInsights(req: AuthenticatedRequest, res: Response) {
    const insights = await this.svc.getInsights(req.identity.userId);
    return res.json({ success: true, data: insights });
  }
}

export class LinkedInController {
  private svc = new LinkedInIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, companyId } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, companyId);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, mediaUrl } = req.body;
      const post = await this.svc.createPost(req.identity.userId, text, mediaUrl);
      return res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export class TikTokController {
  private svc = new TikTokIntegrationService();

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { accessToken, openId } = req.body;
      const connection = await this.svc.connect(req.identity.userId, req.identity.orgId, accessToken, openId);
      return res.status(201).json({ success: true, data: connection });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createVideo(req: AuthenticatedRequest, res: Response) {
    try {
      const { videoUrl, description } = req.body;
      const video = await this.svc.createVideo(req.identity.userId, videoUrl, description);
      return res.status(201).json({ success: true, data: video });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
