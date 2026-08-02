import { startKafkaConsumer } from "@mymanager/node-service-kit";
import { WhatsAppService, TelegramService } from "../../modules/integrations/index.js";
import { config } from "../../config/index.js";

const waSvc = new WhatsAppService();
const tgSvc = new TelegramService();

export async function startOmniSendConsumer(logger: any) {
  await startKafkaConsumer({
    clientId: "integrations-service-send",
    brokers: config.kafkaBrokers,
    groupId: "integrations-service.omni-send",
    topic: "omni.message.send",
    logger,
    onMessage: async ({ payload }) => {
      const { provider, instanceId, to, content, type, metadata } = payload as any;
      logger.info({ provider, to }, "Integrations processing outbound message");

      try {
        if (provider === 'whatsapp') {
          // Logic to send via WhatsApp Instance
          // await waSvc.sendMessage(instanceId, to, content, type, metadata);
          logger.info("Simulated WhatsApp send to " + to);
        } else if (provider === 'telegram') {
          // Logic to send via Telegram Session
          // await tgSvc.sendMessage(instanceId, to, content, type, metadata);
          logger.info("Simulated Telegram send to " + to);
        }
      } catch (err) {
        logger.error({ err, payload }, "Failed to send outbound message");
      }
    },
  });
}
