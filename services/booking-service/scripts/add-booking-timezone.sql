-- Apply once to existing booking databases before deploying the updated service.
-- New databases created from schema.prisma already contain this column.
ALTER TABLE "BookingType" ADD COLUMN IF NOT EXISTS "timeZone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
