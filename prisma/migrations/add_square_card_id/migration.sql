-- AlterTable: add squareCardId to Membership for Artesano card-on-file (no subscription)
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "squareCardId" TEXT;
