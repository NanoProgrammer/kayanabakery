-- AlterTable: add tipCents to Order
ALTER TABLE "Order" ADD COLUMN "tipCents" INTEGER NOT NULL DEFAULT 0;
