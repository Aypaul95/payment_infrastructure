/*
  Warnings:

  - Made the column `idempotencyKey` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "idempotencyKey" SET NOT NULL;
