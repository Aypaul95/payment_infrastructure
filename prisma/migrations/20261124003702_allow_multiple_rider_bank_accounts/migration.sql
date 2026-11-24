-- DropIndex
DROP INDEX "RiderBankAccount_riderId_key";

-- CreateIndex
CREATE INDEX "RiderBankAccount_riderId_createdAt_idx" ON "RiderBankAccount"("riderId", "createdAt");
