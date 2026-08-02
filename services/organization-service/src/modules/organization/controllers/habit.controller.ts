import { Response } from 'express';
import { HabitService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class HabitController {
  private svc = new HabitService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getHabits(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createHabit(req.identity.orgId, req.identity.userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const habitId = String(req.params.habitId || '');
      const data = await this.svc.updateHabit(req.identity.orgId, req.identity.userId, habitId, req.body);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const habitId = String(req.params.habitId || '');
      const data = await this.svc.removeHabit(req.identity.orgId, req.identity.userId, habitId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async checkIn(req: AuthenticatedRequest, res: Response) {
    try {
      const habitId = String(req.params.habitId || '');
      const data = await this.svc.checkInHabit(
        req.identity.orgId,
        req.identity.userId,
        habitId,
        req.body?.date,
      );
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
