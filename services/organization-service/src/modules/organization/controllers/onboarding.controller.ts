import { Response } from 'express';
import { OnboardingService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class OnboardingController {
  private svc = new OnboardingService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getStatuses(req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createStatus(req.identity.userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) {
      if (err.message === 'tourStepId is required') return res.status(400).json({ message: err.message });
      if (err.message === 'Tour already visited') return res.status(409).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }
}
