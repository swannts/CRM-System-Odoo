import http from 'node:http';

import { app, logger } from './app.js';
import { config } from './config/index.js';
import { startOmniSendConsumer } from './integrations/kafka/omni.send.consumer.js';

const server = http.createServer(app);

function scheduleOmniSendConsumerStart(attempt = 1) {
  const maxBackoffMs = 30000;
  const delayMs = Math.min(maxBackoffMs, Math.max(1000, attempt * 2000));

  startOmniSendConsumer(logger)
    .then(() => {
      logger.info({ attempt }, 'omni send consumer started');
    })
    .catch((err) => {
      logger.error({ err, attempt, retryInMs: delayMs }, 'Failed to start omni send consumer, will retry');
      const timer = setTimeout(() => scheduleOmniSendConsumerStart(attempt + 1), delayMs);
      timer.unref?.();
    });
}

server.listen(config.port, '0.0.0.0', async () => {
  logger.info({ port: config.port }, 'integrations-service listening');
  scheduleOmniSendConsumerStart();
});

export default server;
