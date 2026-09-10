CREATE TABLE "Notification" (
  "id" UUID NOT NULL,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'system',
  "category" TEXT NOT NULL DEFAULT 'General',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "isSeen" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Notification_orgId_userId_eventId_key" ON "Notification"("orgId", "userId", "eventId");
CREATE INDEX "Notification_orgId_userId_isArchived_createdAt_idx" ON "Notification"("orgId", "userId", "isArchived", "createdAt");
