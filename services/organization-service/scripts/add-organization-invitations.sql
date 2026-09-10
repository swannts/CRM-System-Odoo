-- Existing installations: apply before deploying the onboarding endpoints.
CREATE TABLE IF NOT EXISTS "OrganizationInvitation" (
  "id" UUID PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "invitedBy" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "acceptedBy" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_organizationId_email_idx" ON "OrganizationInvitation"("organizationId", "email");
