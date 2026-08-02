import { Response } from 'express';
import { GoalService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class GoalController {
  private svc = new GoalService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getGoals(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createGoal(req.identity.orgId, req.identity.userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.updateGoal(req.identity.orgId, req.identity.userId, goalId, req.body);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.removeGoal(req.identity.orgId, req.identity.userId, goalId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async complete(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.completeGoal(req.identity.orgId, req.identity.userId, goalId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async archive(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.archiveGoal(req.identity.orgId, req.identity.userId, goalId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
