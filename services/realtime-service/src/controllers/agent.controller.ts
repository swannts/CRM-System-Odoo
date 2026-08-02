import { Response } from 'express';
import { OmniAgentService } from '../services/index.js';
import { AuthenticatedRequest } from '../middleware/identity.js';

export class OmniAgentController {
  private svc = new OmniAgentService();

  async addAgent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.body?.userId || req.identity.userId || '').trim();
      if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

      const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName : undefined;
      const email = typeof req.body?.email === 'string' ? req.body.email : undefined;
      const status = typeof req.body?.status === 'string' ? req.body.status : undefined;
      const metadata = req.body?.metadata;

      const data = await this.svc.addAgent(req.identity.orgId, userId, { displayName, email, status, metadata });
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateAgentInChat(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = String(req.body?.conversationId || req.body?.chatId || '').trim();
      const agentId = String(req.body?.agentId || req.identity.userId || '').trim();
      if (!conversationId) return res.status(400).json({ success: false, message: 'conversationId is required' });
      if (!agentId) return res.status(400).json({ success: false, message: 'agentId is required' });

      const data = await this.svc.assignAgentToChat(conversationId, agentId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMyAssignedChats(req: AuthenticatedRequest, res: Response) {
    try {
      const chats = await this.svc.getAssignedChats(req.identity.orgId, req.identity.userId);
      return res.json({ success: true, data: chats });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMyTask(req: AuthenticatedRequest, res: Response) {
    try {
      const tasks = await this.svc.getMyTasks(req.identity.orgId, req.identity.userId);
      return res.json({ success: true, data: tasks });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createMyTask(req: AuthenticatedRequest, res: Response) {
    try {
      const title = String(req.body?.title || '').trim();
      if (!title) return res.status(400).json({ success: false, message: 'title is required' });

      const dueAtRaw = req.body?.dueAt;
      const dueAt = dueAtRaw ? new Date(dueAtRaw) : undefined;
      if (dueAtRaw && Number.isNaN(dueAt?.getTime())) {
        return res.status(400).json({ success: false, message: 'dueAt must be a valid date' });
      }

      const task = await this.svc.createTask({
        organizationId: req.identity.orgId,
        agentId: req.identity.userId,
        conversationId: req.body?.conversationId ? String(req.body.conversationId) : undefined,
        title,
        description: req.body?.description ? String(req.body.description) : undefined,
        status: req.body?.status ? String(req.body.status) : undefined,
        priority: req.body?.priority ? String(req.body.priority) : undefined,
        dueAt,
        metadata: req.body?.metadata
      });

      return res.status(201).json({ success: true, data: task });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateMyTask(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = String(req.body?.taskId || req.params?.taskId || '').trim();
      if (!taskId) return res.status(400).json({ success: false, message: 'taskId is required' });

      const patch: any = {};
      if (req.body?.title !== undefined) patch.title = String(req.body.title);
      if (req.body?.description !== undefined) patch.description = String(req.body.description);
      if (req.body?.status !== undefined) patch.status = String(req.body.status);
      if (req.body?.priority !== undefined) patch.priority = String(req.body.priority);
      if (req.body?.metadata !== undefined) patch.metadata = req.body.metadata;
      if (req.body?.dueAt !== undefined) {
        const d = new Date(req.body.dueAt);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ success: false, message: 'dueAt must be a valid date' });
        patch.dueAt = d;
      }

      const updated = await this.svc.updateTask(req.identity.orgId, req.identity.userId, taskId, patch);
      if (!updated.count) return res.status(404).json({ success: false, message: 'Task not found' });

      return res.json({ success: true, data: { updated: updated.count } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async completeMyTask(req: AuthenticatedRequest, res: Response) {
    req.body = { ...req.body, status: 'done' };
    return this.updateMyTask(req, res);
  }

  async deleteMyTask(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = String(req.body?.taskId || req.params?.taskId || '').trim();
      if (!taskId) return res.status(400).json({ success: false, message: 'taskId is required' });

      const deleted = await this.svc.deleteTask(req.identity.orgId, req.identity.userId, taskId);
      if (!deleted.count) return res.status(404).json({ success: false, message: 'Task not found' });
      return res.json({ success: true, data: { deleted: deleted.count } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
