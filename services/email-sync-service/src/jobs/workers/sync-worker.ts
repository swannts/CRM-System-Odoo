import { config } from "../../config/env.js";
import { EmailSyncService } from "../../modules/email-sync/email-sync.service.js";
import { SequenceService } from "../../modules/sequences/sequence.service.js";

const sequenceService = new SequenceService();
const emailSyncService = new EmailSyncService();

export class EmailSyncWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly syncIntervalMs = Math.min(Math.max(config.emailSyncIntervalMs, 5 * 60 * 1000), 15 * 60 * 1000);

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log("Starting Email Sync Worker...");
    this.runTick().catch((err) => console.error("Initial sync tick failed:", err));

    this.intervalId = setInterval(async () => {
      await this.runTick();
    }, this.syncIntervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("Email Sync Worker stopped.");
  }

  private async runTick() {
    try {
      await emailSyncService.syncEligibleAccounts();
    } catch (error) {
      console.error("Error in sync worker run:", error);
    }

    try {
      await sequenceService.processPendingActivities();
    } catch (error) {
      console.error("Error in sequence processing:", error);
    }
  }
}
