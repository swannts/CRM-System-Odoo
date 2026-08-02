import { app, logger } from './app.js';
import { config } from './config/index.js';
import { EmailSyncWorker } from './jobs/workers/sync-worker.js';

app.listen(config.port, '0.0.0.0', () => {
  logger.info({ port: config.port, nodeEnv: config.nodeEnv }, 'email-sync-service listening');

  const syncWorker = new EmailSyncWorker();
  syncWorker.start();
});

export default app;
