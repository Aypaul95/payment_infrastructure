-- CreateEnum
CREATE TYPE "ReconciliationOutcome" AS ENUM ('SUCCESSFUL', 'STILL_PENDING', 'DETAILS_MISMATCH', 'PROVIDER_ERROR', 'NOT_FOUND', 'NOT_PENDING');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "nextReconciliationAt" TIMESTAMP(3),
ADD COLUMN     "reconciliationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reconciliationLockToken" TEXT,
ADD COLUMN     "reconciliationLockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentReconciliationAttempt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "ReconciliationOutcome" NOT NULL,
    "providerStatus" TEXT,
    "errorCode" TEXT,

    CONSTRAINT "PaymentReconciliationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentReconciliationAttempt_paymentId_attemptedAt_idx" ON "PaymentReconciliationAttempt"("paymentId", "attemptedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliationAttempt_outcome_idx" ON "PaymentReconciliationAttempt"("outcome");

-- CreateIndex
CREATE INDEX "Payment_status_nextReconciliationAt_idx" ON "Payment"("status", "nextReconciliationAt");

-- AddForeignKey
ALTER TABLE "PaymentReconciliationAttempt" ADD CONSTRAINT "PaymentReconciliationAttempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
