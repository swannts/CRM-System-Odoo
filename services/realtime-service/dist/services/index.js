import { LiveChatChannelRepository, LiveChatMessageRepository, LiveChatContactRepository, LiveChatWidgetSettingRepository, LiveChatStatisticsRepository, SocketConnectionRepository } from '../repositories/livechat/index.js';
import { OmniConversationRepository, OmniMessageRepository, OmniParticipantRepository, OmniAgentRepository, OmniAgentTaskRepository } from '../repositories/omni/index.js';
export class LiveChatChannelService {
    repo = new LiveChatChannelRepository();
    async createChannel(data) {
        return this.repo.create(data);
    }
    async getChannelsByAdminId(adminId) {
        return this.repo.findByAdminId(adminId);
    }
    async getChannelById(id) {
        return this.repo.findById(id);
    }
    async getChannelsByOrganization(organizationId) {
        return this.repo.findByOrganizationId(organizationId);
    }
    async deleteChannel(id) {
        return this.repo.delete(id);
    }
    async updateLastMessage(id) {
        return this.repo.updateLastMessage(id);
    }
}
export class LiveChatMessageService {
    repo = new LiveChatMessageRepository();
    channelRepo = new LiveChatChannelRepository();
    async addMessage(data) {
        const message = await this.repo.create(data);
        await this.channelRepo.updateLastMessage(data.channelId);
        return message;
    }
    async getChatHistory(channelId, limit = 50) {
        return this.repo.findByChannelId(channelId, limit);
    }
    async markAsRead(channelId, userId) {
        return this.repo.markAsRead(channelId, userId);
    }
    async getUnreadCount(channelId, excludeUserId) {
        return this.repo.getUnreadCount(channelId, excludeUserId);
    }
}
export class LiveChatContactService {
    repo = new LiveChatContactRepository();
    async createContact(data) {
        return this.repo.create(data);
    }
    async getContactById(id) {
        return this.repo.findById(id);
    }
    async getContactsByUserId(userId) {
        return this.repo.findByUserId(userId);
    }
    async updateContact(id, data) {
        return this.repo.update(id, data);
    }
    async findOrCreateByPhone(phone, organizationId, name) {
        const existing = await this.repo.findByPhone(phone, organizationId);
        if (existing)
            return existing;
        return this.repo.create({
            phone,
            organizationId,
            name: name || `Contact ${phone.slice(-4)}`,
            userId: '00000000-0000-0000-0000-000000000000'
        });
    }
}
export class LiveChatWidgetSettingService {
    repo = new LiveChatWidgetSettingRepository();
    async saveSetting(userId, organizationId, data) {
        return this.repo.upsert(userId, organizationId, data);
    }
    async getSettingByUserId(userId) {
        return this.repo.findByUserId(userId);
    }
    async getSettingByOrganization(organizationId) {
        return this.repo.findByOrganizationId(organizationId);
    }
}
export class LiveChatStatisticsService {
    repo = new LiveChatStatisticsRepository();
    async getStatistics(organizationId, startDate, endDate) {
        return this.repo.findByOrganizationId(organizationId, startDate, endDate);
    }
    async updateDailyStats(organizationId, data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.repo.updateDaily(organizationId, today, data);
    }
}
export class SocketConnectionService {
    repo = new SocketConnectionRepository();
    async registerConnection(socketId, userId, organizationId, contactId, deviceType) {
        return this.repo.create({ socketId, userId, organizationId, contactId, deviceType });
    }
    async disconnect(socketId) {
        return this.repo.disconnect(socketId);
    }
    async getActiveConnections(organizationId) {
        return this.repo.findByOrganizationId(organizationId);
    }
    async getUserConnections(userId) {
        return this.repo.findByUserId(userId);
    }
}
export class OmniConversationService {
    repo = new OmniConversationRepository();
    participantRepo = new OmniParticipantRepository();
    async createConversation(data) {
        const conversation = await this.repo.create(data);
        // Add contact as participant
        await this.participantRepo.create({
            conversationId: conversation.id,
            participantId: data.contactId,
            participantType: 'contact'
        });
        return conversation;
    }
    async findOrCreateByContact(contactId, organizationId, provider, providerRef) {
        const existing = await this.repo.findByOrganizationAndProviderRef(organizationId, provider, providerRef);
        if (existing)
            return existing;
        return this.createConversation({
            contactId,
            organizationId,
            provider,
            providerRef,
            status: 'open'
        });
    }
    async getConversationsByOrganization(organizationId) {
        return this.repo.findByOrganizationId(organizationId);
    }
    async getConversationById(id) {
        return this.repo.findById(id);
    }
    async assignAgent(id, agentId) {
        // Add agent as participant if not already there
        const participants = await this.participantRepo.findByConversationId(id);
        const isAgentIn = participants.some((p) => p.participantId === agentId);
        if (!isAgentIn) {
            await this.participantRepo.create({
                conversationId: id,
                participantId: agentId,
                participantType: 'agent'
            });
        }
        return this.repo.assignAgent(id, agentId);
    }
    async updateConversation(id, data) {
        return this.repo.update(id, data);
    }
}
export class OmniMessageService {
    repo = new OmniMessageRepository();
    convRepo = new OmniConversationRepository();
    async getConversationById(id) {
        return this.convRepo.findById(id);
    }
    async addMessage(data) {
        const message = await this.repo.create(data);
        // Update conversation last message
        await this.convRepo.update(data.conversationId, {
            lastMessage: data.content,
            lastMessageAt: new Date()
        });
        return message;
    }
    async addInboundMessage(data) {
        return this.addMessage({
            conversationId: data.conversationId,
            senderId: data.senderId,
            senderType: 'contact',
            content: data.content,
            type: data.type,
            direction: 'inbound',
            status: 'delivered',
            metadata: data.metadata
        });
    }
    async getConversationHistory(conversationId, limit = 50) {
        return this.repo.findByConversationId(conversationId, limit);
    }
    async updateMessageStatus(id, status) {
        return this.repo.updateStatus(id, status);
    }
}
export class OmniAgentService {
    agentRepo = new OmniAgentRepository();
    taskRepo = new OmniAgentTaskRepository();
    conversationRepo = new OmniConversationRepository();
    omniConversationService = new OmniConversationService();
    async addAgent(organizationId, userId, data) {
        return this.agentRepo.upsertByOrgAndUser(organizationId, userId, {
            displayName: data.displayName,
            email: data.email,
            status: data.status || 'available',
            isActive: true,
            metadata: data.metadata
        });
    }
    async assignAgentToChat(conversationId, agentId) {
        return this.omniConversationService.assignAgent(conversationId, agentId);
    }
    async getAssignedChats(organizationId, agentId) {
        return this.conversationRepo.findByOrganizationIdAndAssignedAgent(organizationId, agentId);
    }
    async getMyTasks(organizationId, agentId) {
        return this.taskRepo.findByAgentId(agentId, organizationId);
    }
    async createTask(data) {
        return this.taskRepo.create(data);
    }
    async updateTask(organizationId, agentId, taskId, data) {
        return this.taskRepo.updateById(taskId, organizationId, agentId, data);
    }
    async deleteTask(organizationId, agentId, taskId) {
        return this.taskRepo.deleteById(taskId, organizationId, agentId);
    }
}
