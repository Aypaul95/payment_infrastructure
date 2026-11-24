-- CreateEnum
CREATE TYPE "RiderEarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'SETTLED', 'REVERSED');

-- CreateTable
CREATE TABLE "RiderEarning" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "baseAmount" BIGINT NOT NULL DEFAULT 0,
    "distanceKm" DECIMAL(10,3) NOT NULL,
    "ratePerKm" BIGINT NOT NULL DEFAULT 0,
    "distanceAmount" BIGINT NOT NULL DEFAULT 0,
    "incentiveAmount" BIGINT NOT NULL DEFAULT 0,
    "grossAmount" BIGINT NOT NULL,
    "commissionAmount" BIGINT NOT NULL DEFAULT 0,
    "deductionAmount" BIGINT NOT NULL DEFAULT 0,
    "netAmount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "RiderEarningStatus" NOT NULL DEFAULT 'PENDING',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderEarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiderEarning_deliveryId_key" ON "RiderEarning"("deliveryId");

-- CreateIndex
CREATE INDEX "RiderEarning_riderId_status_earnedAt_idx" ON "RiderEarning"("riderId", "status", "earnedAt");

-- CreateIndex
CREATE INDEX "RiderEarning_status_earnedAt_idx" ON "RiderEarning"("status", "earnedAt");

-- AddForeignKey
ALTER TABLE "RiderEarning" ADD CONSTRAINT "RiderEarning_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderEarning" ADD CONSTRAINT "RiderEarning_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
