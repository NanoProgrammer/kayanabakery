-- ============================================================================
-- Karyana — schema changes to apply by hand
--
-- For when `npm run db:push` can't reach the database (a network or VPN that
-- blocks port 5432). Paste this whole file into the Neon console's SQL Editor,
-- which goes over HTTPS from the browser and is not affected by that.
--
-- Safe to run more than once: every statement checks first, so anything
-- already applied is skipped rather than failing. Nothing here drops or
-- rewrites existing data — it only adds.
-- ============================================================================

-- Twilio message ids, so a scheduled "ready" / "completed" text can be found
-- and cancelled if the order changes.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "readyMsgSid"     TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "completedMsgSid" TEXT;

-- Counter behind "Las penas con pan son menos". Timestamp only, on purpose:
-- the nominee's story stays in the owner's inbox, not in a table.
CREATE TABLE IF NOT EXISTS "Nomination" (
  "id"        TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Nomination_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Nomination_createdAt_idx" ON "Nomination" ("createdAt");

-- Weekly box cadence: weekly, or every 4 weeks counted from the anchor week.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WeeklyFrequency') THEN
    CREATE TYPE "WeeklyFrequency" AS ENUM ('WEEKLY', 'EVERY_4_WEEKS');
  END IF;
END
$$;

ALTER TABLE "Membership"
  ADD COLUMN IF NOT EXISTS "weeklyFrequency" "WeeklyFrequency" NOT NULL DEFAULT 'WEEKLY';
ALTER TABLE "Membership"
  ADD COLUMN IF NOT EXISTS "weeklyAnchorAt" TIMESTAMP(3);

-- Existing members keep getting bread every week, which is what they signed
-- up for; the anchor stays null until someone switches to every 4 weeks.
