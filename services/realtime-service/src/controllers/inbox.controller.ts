import { Response } from 'express';
import { OmniConversationService, OmniMessageService, LiveChatContactService } from '../services/index.js';
import { AuthenticatedRequest } from '../middleware/identity.js';

export class InboxCompatController {
  private convSvc = new OmniConversationService();
  private msgSvc = new OmniMessageService();
  private contactSvc = new LiveChatContactService();

  async getChats(req: AuthenticatedRequest, res: Response) {
    try {
      const chats = await this.convSvc.getConversationsByOrganization(req.identity.orgId);
      return res.json({ success: true, data: chats });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConvo(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = String(req.body?.conversationId || req.body?.chatId || req.query?.conversationId || '').trim();
      if (!conversationId) return res.status(400).json({ success: false, message: 'conversationId is required' });
      const history = await this.msgSvc.getConversationHistory(conversationId);
      return res.json({ success: true, data: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendText(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = String(req.body?.conversationId || req.body?.chatId || '').trim();
      const content = String(req.body?.content || req.body?.text || '').trim();
      if (!conversationId || !content) {
        return res.status(400).json({ success: false, message: 'conversationId and content are required' });
      }

      const message = await this.msgSvc.addMessage({
        conversationId,
        senderId: req.identity.userId,
        senderType: 'agent',
        content,
        type: 'text',
        direction: 'outbound'
      });

      return res.status(201).json({ success: true, data: message });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendImage(req: AuthenticatedRequest, res: Response) {
    try {
      const conversationId = String(req.body?.conversationId || req.body?.chatId || '').trim();
      const imageUrl = String(req.body?.imageUrl || req.body?.url || '').trim();
      const caption = req.body?.caption ? String(req.body.caption) : '';
      if (!conversationId || !imageUrl) {
        return res.status(400).json({ success: false, message: 'conversationId and imageUrl are required' });
      }

      const message = await this.msgSvc.addMessage({
        conversationId,
        senderId: req.identity.userId,
        senderType: 'agent',
        content: caption || imageUrl,
        type: 'image',
        direction: 'outbound',
        metadata: { imageUrl, ...(req.body?.metadata || {}) }
      });

      return res.status(201).json({ success: true, data: message });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async webhook(req: any, res: Response) {
    try {
      const uid = String(req.params.uid || '').trim();
      const organizationId = String(req.body?.organizationId || req.query?.organizationId || '').trim();
      const contactMobile = String(req.body?.contactMobile || req.body?.from || req.body?.phone || '').trim();
      const content = String(req.body?.content || req.body?.text || '').trim();
      const provider = String(req.body?.provider || 'whatsapp').trim();
      const type = String(req.body?.type || 'text').trim();
      const contactName = req.body?.contactName ? String(req.body.contactName) : undefined;

      if (!organizationId || !contactMobile || !content) {
        return res.status(400).json({ success: false, message: 'organizationId, contactMobile, and content are required' });
      }

      const contact = await this.contactSvc.findOrCreateByPhone(contactMobile, organizationId, contactName);
      const conversation = await this.convSvc.findOrCreateByContact(contact.id, organizationId, provider, contactMobile);
      const message = await this.msgSvc.addInboundMessage({
        conversationId: conversation.id,
        senderId: contact.id,
        content,
        type,
        metadata: { uid, ...(req.body?.metadata || {}) }
      });

      return res.status(201).json({ success: true, data: { uid, conversationId: conversation.id, messageId: message.id } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
