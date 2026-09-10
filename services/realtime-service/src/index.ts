import { recordNotification, deliverTaskReminders } from './services/notifications.service.js';
import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createServiceApp, requireOrganizationMembership, startKafkaConsumer, verifyAccessToken } from "@mymanager/node-service-kit";
import { 
  LiveChatChannelController, 
  LiveChatMessageController, 
  LiveChatContactController,
  LiveChatWidgetSettingController,
  LiveChatStatisticsController,
  OmniConversationController,
  OmniMessageController,
  OmniAIController,
  OmniAgentController,
  InboxCompatController,
  NotificationsController
} from "./controllers/index.js";
import { identityMiddleware } from "./middleware/identity.js";
import { LiveChatChannelRepository } from "./repositories/livechat/channel.repository.js";

const { app, logger } = createServiceApp({ serviceName: "realtime-service", jsonLimit: "10mb" });
const auth = identityMiddleware;
const cast = (req: any) => req as any;
const route = (handler: (req: any, res: any) => unknown) => (req: any, res: any) => handler(cast(req), res);

const channelCtrl = new LiveChatChannelController();
const messageCtrl = new LiveChatMessageController();
const contactCtrl = new LiveChatContactController();
const widgetCtrl = new LiveChatWidgetSettingController();
const statsCtrl = new LiveChatStatisticsController();
const omniConvCtrl = new OmniConversationController();
const omniMsgCtrl = new OmniMessageController();
const omniAICtrl = new OmniAIController();
const omniAgentCtrl = new OmniAgentController();
const inboxCompatCtrl = new InboxCompatController();
const channelRepo = new LiveChatChannelRepository();

// --- Live Chat ---
app.post("/v1/livechat/channels", auth, (req: any, res: any) => channelCtrl.getChannelsByAdminId(cast(req), res));
app.get("/v1/livechat/channel/:channelId", auth, (req: any, res: any) => channelCtrl.getChannelById(cast(req), res));
app.delete("/v1/livechat/channel/:channelId/:contactId", auth, (req: any, res: any) => channelCtrl.deleteChannel(cast(req), res));

app.get("/v1/livechat/chathistory/:channelId", auth, (req: any, res: any) => messageCtrl.getChatHistory(cast(req), res));
app.post("/v1/livechat/newmessage", auth, (req: any, res: any) => messageCtrl.addMessage(cast(req), res));
app.get("/v1/livechat/chats-and-contacts", auth, (req: any, res: any) => messageCtrl.getChatsAndContacts(cast(req), res));

app.post("/v1/livechat/contact", auth, (req: any, res: any) => contactCtrl.createContact(cast(req), res));

app.post("/v1/livechat/widget-setting", auth, (req: any, res: any) => widgetCtrl.saveSetting(cast(req), res));
app.get("/v1/livechat/widget-setting", auth, (req: any, res: any) => widgetCtrl.getSetting(cast(req), res));
app.get("/v1/livechat/widget-setting/pub", (_req: any, res: any) => res.status(501).json({
  message: "Public widget settings require a scoped public token and are not enabled yet.",
}));
app.post("/v1/livechat/widget-setting/send-code", auth, (req: any, res: any) => widgetCtrl.sendCode(cast(req), res));

app.get("/v1/livechat/statistics", auth, (req: any, res: any) => statsCtrl.getStatistics(cast(req), res));

// --- Omni ---
app.get("/v1/omni/conversations", auth, route(omniConvCtrl.getConversations.bind(omniConvCtrl)));
app.get("/v1/omni/conversations/:conversationId", auth, route(omniConvCtrl.getConversationById.bind(omniConvCtrl)));
app.post("/v1/omni/conversations/:conversationId/assign", auth, route(omniConvCtrl.assignAgent.bind(omniConvCtrl)));
app.patch("/v1/omni/conversations/:conversationId", auth, route(omniConvCtrl.updateConversation.bind(omniConvCtrl)));
app.get("/v1/omni/conversations/:conversationId/history", auth, route(omniMsgCtrl.getHistory.bind(omniMsgCtrl)));
app.post("/v1/omni/messages", auth, route(omniMsgCtrl.addMessage.bind(omniMsgCtrl)));
app.post("/v1/omni/ai/translate", auth, route(omniAICtrl.translate.bind(omniAICtrl)));
app.post("/v1/omni/ai/suggest-reply", auth, route(omniAICtrl.suggestReply.bind(omniAICtrl)));

// --- Agent Management ---
app.post("/v1/agent/add_agent", auth, route(omniAgentCtrl.addAgent.bind(omniAgentCtrl)));
app.post("/v1/agent/update_agent_in_chat", auth, route(omniAgentCtrl.updateAgentInChat.bind(omniAgentCtrl)));
app.get("/v1/agent/get_my_assigned_chats", auth, route(omniAgentCtrl.getMyAssignedChats.bind(omniAgentCtrl)));
app.get("/v1/agent/get_my_task", auth, route(omniAgentCtrl.getMyTask.bind(omniAgentCtrl)));
app.post("/v1/agent/create_task", auth, route(omniAgentCtrl.createMyTask.bind(omniAgentCtrl)));
app.patch("/v1/agent/update_task", auth, route(omniAgentCtrl.updateMyTask.bind(omniAgentCtrl)));
app.post("/v1/agent/complete_task", auth, route(omniAgentCtrl.completeMyTask.bind(omniAgentCtrl)));
app.delete("/v1/agent/delete_task", auth, route(omniAgentCtrl.deleteMyTask.bind(omniAgentCtrl)));

// --- Inbox compatibility ---
app.get("/v1/inbox/get_chats", auth, route(inboxCompatCtrl.getChats.bind(inboxCompatCtrl)));
app.post("/v1/inbox/get_convo", auth, route(inboxCompatCtrl.getConvo.bind(inboxCompatCtrl)));
app.post("/v1/inbox/send_text", auth, route(inboxCompatCtrl.sendText.bind(inboxCompatCtrl)));
app.post("/v1/inbox/send_image", auth, route(inboxCompatCtrl.sendImage.bind(inboxCompatCtrl)));
app.all("/v1/inbox/webhook/:uid", route(inboxCompatCtrl.webhook.bind(inboxCompatCtrl)));

// Persistent notifications scoped to the verified recipient.
const notificationsCtrl = new NotificationsController();
app.get("/v1/notifications", auth, route(notificationsCtrl.list.bind(notificationsCtrl)));
app.get("/v1/notifications/total", auth, route(notificationsCtrl.total.bind(notificationsCtrl)));
app.post("/v1/notifications/read", auth, route(notificationsCtrl.read.bind(notificationsCtrl)));
app.post("/v1/notifications/archive", auth, route(notificationsCtrl.archive.bind(notificationsCtrl)));
app.post("/v1/notifications/unarchive", auth, route(notificationsCtrl.unarchive.bind(notificationsCtrl)));
app.post("/v1/notifications/mark-seen/:id", auth, route(notificationsCtrl.markSeen.bind(notificationsCtrl)));
app.post("/v1/notifications/mark-seen/:id/:userId", auth, route(notificationsCtrl.markSeen.bind(notificationsCtrl)));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { 
    origin: (process.env.ALLOWED_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean),
    credentials: true
  }
});

io.use(async (socket, next) => {
  try {
    const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null;
    const orgId = typeof socket.handshake.auth?.orgId === "string" ? socket.handshake.auth.orgId : null;
    const claims = await verifyAccessToken(token ? `Bearer ${token}` : null, {
      issuer: process.env.KEYCLOAK_ISSUER,
      audience: process.env.KEYCLOAK_CLIENT_ID || "mymanager-web",
    });
    const userId = typeof claims.sub === "string" ? claims.sub : null;
    if (!userId || !orgId) return next(new Error("Authenticated organization is required"));
    const membership = await fetch(`${process.env.ORGANIZATION_SERVICE_URL || "http://organization-service:7010"}/v1/memberships/resolve`, {
      headers: { Authorization: `Bearer ${token}`, "X-Org-Id": orgId },
    });
    if (!membership.ok) return next(new Error("Organization membership denied"));
    socket.data.userId = userId;
    socket.data.orgId = orgId;
    socket.data.token = token;
    next();
  } catch {
    next(new Error("Invalid or expired access token"));
  }
});

io.on("connection", (socket) => {
  logger.info({ id: socket.id }, "socket connected");

  socket.use(async (_packet, next) => {
    try {
      const token = socket.data.token as string;
      const claims = await verifyAccessToken(`Bearer ${token}`, {
        issuer: process.env.KEYCLOAK_ISSUER,
        audience: process.env.KEYCLOAK_CLIENT_ID || "mymanager-web",
      });
      if (claims.sub !== socket.data.userId) return next(new Error("Socket identity changed"));
      const membership = await requireOrganizationMembership({
        orgId: socket.data.orgId,
        userId: socket.data.userId,
        authorization: `Bearer ${token}`,
      });
      if (!membership) return next(new Error("Organization membership denied"));
      next();
    } catch {
      next(new Error("Socket session expired or membership revoked"));
    }
  });
  
  socket.on("join-org", (orgId: string) => {
    if (orgId !== socket.data.orgId) return;
    socket.join(`org:${orgId}`);
    logger.info({ socketId: socket.id, orgId }, "socket joined org room");
  });
  
  socket.on("join-channel", async (channelId: string) => {
    const channel = await channelRepo.findById(channelId);
    if (!channel || channel.organizationId !== socket.data.orgId || !channel.isActive) return;
    socket.join(`org:${socket.data.orgId}:channel:${channelId}`);
    logger.info({ socketId: socket.id, channelId }, "socket joined channel room");
  });

  // --- CRM Collaboration ---
  socket.on("join-contact", (data: { contactId: string; userId: string; userName: string }) => {
    const { contactId, userName } = data;
    const userId = socket.data.userId;
    const room = `org:${socket.data.orgId}:contact:${contactId}`;
    socket.join(room);
    
    // Notify others in the room that someone is viewing
    socket.to(room).emit("contact:presence", {
      contactId,
      userId,
      userName,
      action: 'viewing'
    });
    
    logger.info({ socketId: socket.id, contactId, userId }, "socket joined contact room");
  });

  socket.on("contact:editing", (data: { contactId: string; userId: string; userName: string }) => {
    socket.to(`org:${socket.data.orgId}:contact:${data.contactId}`).emit("contact:presence", {
      ...data,
      userId: socket.data.userId,
      action: 'editing'
    });
  });

  socket.on("contact:update", (data: { contactId: string; userId: string; updates: any }) => {
    const room = `org:${socket.data.orgId}:contact:${data.contactId}`;
    // Broadcast to everyone in the contact room (including sender if needed, but usually sender already has it)
    io.to(room).emit("contact:updated", { ...data, userId: socket.data.userId });
    // Also broadcast to the org room for list view updates
    const rooms = Array.from(socket.rooms);
    const orgRoom = rooms.find(r => r.startsWith('org:'));
    if (orgRoom) {
      io.to(orgRoom).emit("contact:list-updated", data);
    }
  });
  
  socket.emit("hello", { message: "connected to realtime-service" });
  socket.on("disconnect", () => logger.info({ id: socket.id }, "socket disconnected"));
});

async function startConsumer() {
  const brokers = process.env.KAFKA_BROKERS || "localhost:9092";
  await startKafkaConsumer({
    clientId: "realtime-service",
    brokers,
    groupId: "realtime-service.domain-events",
    topics: ["billing.payment.recorded", "omni.message.received"],
    logger,
    onMessage: async ({ topic, payload }) => {
      if (topic === "omni.message.received") {
        const event = payload as any;
        logger.info({ event }, "Processing incoming omni message");
        
        try {
          // Handle inbound message logic
          // 1. Find or create contact
          let contact = await contactCtrl.findOrCreateByPhone(event.contactMobile, event.organizationId, event.contactName);
          
          // 2. Find or create conversation
          let conversation = await omniConvCtrl.findOrCreateByContact(contact.id, event.organizationId, event.provider, event.contactMobile);
          
          // 3. Add message
          const message = await omniMsgCtrl.addInboundMessage({
            conversationId: conversation.id,
            senderId: contact.id,
            content: event.content,
            type: event.type,
            metadata: event.metadata
          });
          
          // 4. Push to sockets
          io.to(`org:${event.organizationId}`).emit("omni:message", {
            conversationId: conversation.id,
            message
          });
          
        } catch (err) {
          logger.error({ err }, "Failed to process inbound omni message");
        }
      } else if (topic === "billing.payment.recorded") {
        const event = payload as any;
        if (!event?.org_id || !event?.actor_user_id || !event?.payment_id) {
          logger.warn({ topic }, "Ignoring invalid payment notification event");
          return;
        }
        await recordNotification({
          orgId: event.org_id, userId: event.actor_user_id,
          eventId: `payment:${event.payment_id}`, type: "payment", category: "Billing",
          title: "Payment recorded", body: `Payment recorded for invoice ${event.invoice_id}`,
        });
        io.to(`org:${event.org_id}`).emit("domain-event", { routingKey: topic, data: payload });
      }
    },
  });
}

app.get("/health", (_req: any, res: any) => res.json({ status: "ok", service: "realtime-service" }));

const port = Number(process.env.PORT || 7030);
server.listen(port, "0.0.0.0", async () => {
  logger.info({ port }, "realtime-service listening (TS + Socket.IO)");
  let remindersRunning = false;
  const reminders = async () => {
    if (remindersRunning) return;
    remindersRunning = true;
    try { await deliverTaskReminders(); }
    catch (err) { logger.error({ err }, "Task reminders will retry on the next interval"); }
    finally { remindersRunning = false; }
  };
  void reminders();
  setInterval(() => void reminders(), 60_000).unref();
  try {
    await startConsumer();
  } catch (err) {
    logger.error({ err }, "failed to start consumer");
  }
});
