import { Response } from 'express';
import { emitOmniMessageSend } from '../kafka/omni.producer.js';
import {
  OmniConversationService,
  OmniMessageService,
  OmniAgentService,
} from '../services/index.js';
import { AuthenticatedRequest } from '../middleware/identity.js';
import { getRouteParam } from './utils.js';

export class OmniConversationController {
  private svc = new OmniConversationService();

  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const conversations = await this.svc.getConversationsByOrganization(req.identity.orgId);
      return res.json({ success: true, data: conversations });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConversationById(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = getRouteParam(req.params.conversationId);
      const conversation = await this.svc.getConversationById(conversationId);
      if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
      return res.json({ success: true, data: conversation });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async assignAgent(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = getRouteParam(req.params.conversationId);
      const { agentId } = req.body;
      const conversation = await this.svc.assignAgent(conversationId, agentId || req.identity.userId);
      return res.json({ success: true, data: conversation });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = getRouteParam(req.params.conversationId);
      const conversation = await this.svc.updateConversation(conversationId, req.body);
      return res.json({ success: true, data: conversation });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Internal use
  async findOrCreateByContact(contactId: string, organizationId: string, provider: string, providerRef: string) {
    return this.svc.findOrCreateByContact(contactId, organizationId, provider, providerRef);
  }
}

export class OmniMessageController {
  private svc = new OmniMessageService();

  async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = getRouteParam(req.params.conversationId);
      const history = await this.svc.getConversationHistory(conversationId);
      return res.json({ success: true, data: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async addMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId, content, type, metadata } = req.body;
      const conversation = await this.svc.getConversationById(conversationId);
      if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

      const message = await this.svc.addMessage({
        conversationId,
        senderId: req.identity.userId,
        senderType: 'agent',
        content,
        type,
        metadata,
        direction: 'outbound'
      });

      await emitOmniMessageSend({
        provider: conversation.provider,
        instanceId: conversation.providerRef,
        to: conversation.providerRef,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        organizationId: req.identity.orgId
      });

      return res.status(201).json({ success: true, data: message });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Internal use
  async addInboundMessage(data: { conversationId: string; senderId: string; content: string; type: string; metadata?: any }) {
    return this.svc.addInboundMessage(data);
  }
}

export class OmniAIController {
  async translate(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, targetLang } = req.body;
      if (!text || !targetLang) return res.status(400).json({ success: false, message: 'text and targetLang required' });

      const translatedText = `[Translated to ${targetLang}]: ${text}`;
      return res.json({ success: true, data: { translatedText } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async suggestReply(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.body;
      if (!conversationId) return res.status(400).json({ success: false, message: 'conversationId required' });

      const suggestion = "Thank you for reaching out! How can I help you today?";
      return res.json({ success: true, data: { suggestion } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
