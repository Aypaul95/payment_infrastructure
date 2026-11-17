-- CreateEnum
CREATE TYPE "SmsOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "SmsOutbox" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "status" "SmsOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsOutbox_status_nextAttemptAt_idx" ON "SmsOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "SmsOutbox_deliveryId_createdAt_idx" ON "SmsOutbox"("deliveryId", "createdAt");

-- AddForeignKey
ALTER TABLE "SmsOutbox" ADD CONSTRAINT "SmsOutbox_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
