/*
  Warnings:

  - A unique constraint covering the columns `[id,businessAccountId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VendorBankAccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "VendorLedgerBucket" AS ENUM ('AVAILABLE', 'RESERVED');

-- CreateEnum
CREATE TYPE "VendorLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "VendorLedgerEntryType" AS ENUM ('ORDER_CREDIT', 'SETTLEMENT_RESERVE', 'SETTLEMENT_RELEASE', 'SETTLEMENT_PAYOUT', 'REVERSAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "VendorSettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'CANCELLED', 'REQUIRES_RECONCILIATION');

-- CreateEnum
CREATE TYPE "PlatformRevenueEntryType" AS ENUM ('SERVICE_FEE_RECOGNITION', 'REVERSAL', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "VendorBankAccount" (
    "id" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "encryptedAccountNumber" TEXT NOT NULL,
    "maskedAccountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "recipientCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "VendorBankAccountStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSettlement" (
    "id" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "VendorSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "paystackTransferCode" TEXT,
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorLedgerEntry" (
    "id" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "orderId" TEXT,
    "settlementId" TEXT,
    "recognitionKey" TEXT,
    "bucket" "VendorLedgerBucket" NOT NULL,
    "direction" "VendorLedgerDirection" NOT NULL,
    "type" "VendorLedgerEntryType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reference" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRevenueEntry" (
    "id" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "recognitionKey" TEXT,
    "type" "PlatformRevenueEntryType" NOT NULL,
    "direction" "VendorLedgerDirection" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reference" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRevenueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorBankAccount_recipientCode_key" ON "VendorBankAccount"("recipientCode");

-- CreateIndex
CREATE INDEX "VendorBankAccount_businessAccountId_status_idx" ON "VendorBankAccount"("businessAccountId", "status");

-- CreateIndex
CREATE INDEX "VendorBankAccount_businessAccountId_isDefault_idx" ON "VendorBankAccount"("businessAccountId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBankAccount_id_businessAccountId_key" ON "VendorBankAccount"("id", "businessAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSettlement_reference_key" ON "VendorSettlement"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSettlement_paystackTransferCode_key" ON "VendorSettlement"("paystackTransferCode");

-- CreateIndex
CREATE INDEX "VendorSettlement_businessAccountId_status_createdAt_idx" ON "VendorSettlement"("businessAccountId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "VendorSettlement_status_createdAt_idx" ON "VendorSettlement"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSettlement_businessAccountId_idempotencyKey_key" ON "VendorSettlement"("businessAccountId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSettlement_id_businessAccountId_key" ON "VendorSettlement"("id", "businessAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorLedgerEntry_recognitionKey_key" ON "VendorLedgerEntry"("recognitionKey");

-- CreateIndex
CREATE UNIQUE INDEX "VendorLedgerEntry_reference_key" ON "VendorLedgerEntry"("reference");

-- CreateIndex
CREATE INDEX "VendorLedgerEntry_businessAccountId_bucket_createdAt_idx" ON "VendorLedgerEntry"("businessAccountId", "bucket", "createdAt");

-- CreateIndex
CREATE INDEX "VendorLedgerEntry_businessAccountId_type_createdAt_idx" ON "VendorLedgerEntry"("businessAccountId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "VendorLedgerEntry_orderId_idx" ON "VendorLedgerEntry"("orderId");

-- CreateIndex
CREATE INDEX "VendorLedgerEntry_settlementId_idx" ON "VendorLedgerEntry"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRevenueEntry_recognitionKey_key" ON "PlatformRevenueEntry"("recognitionKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRevenueEntry_reference_key" ON "PlatformRevenueEntry"("reference");

-- CreateIndex
CREATE INDEX "PlatformRevenueEntry_businessAccountId_type_createdAt_idx" ON "PlatformRevenueEntry"("businessAccountId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformRevenueEntry_orderId_idx" ON "PlatformRevenueEntry"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_id_businessAccountId_key" ON "Order"("id", "businessAccountId");

-- AddForeignKey
ALTER TABLE "VendorBankAccount" ADD CONSTRAINT "VendorBankAccount_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSettlement" ADD CONSTRAINT "VendorSettlement_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSettlement" ADD CONSTRAINT "VendorSettlement_bankAccountId_businessAccountId_fkey" FOREIGN KEY ("bankAccountId", "businessAccountId") REFERENCES "VendorBankAccount"("id", "businessAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLedgerEntry" ADD CONSTRAINT "VendorLedgerEntry_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLedgerEntry" ADD CONSTRAINT "VendorLedgerEntry_orderId_businessAccountId_fkey" FOREIGN KEY ("orderId", "businessAccountId") REFERENCES "Order"("id", "businessAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLedgerEntry" ADD CONSTRAINT "VendorLedgerEntry_settlementId_businessAccountId_fkey" FOREIGN KEY ("settlementId", "businessAccountId") REFERENCES "VendorSettlement"("id", "businessAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenueEntry" ADD CONSTRAINT "PlatformRevenueEntry_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenueEntry" ADD CONSTRAINT "PlatformRevenueEntry_orderId_businessAccountId_fkey" FOREIGN KEY ("orderId", "businessAccountId") REFERENCES "Order"("id", "businessAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce positive financial amounts.
ALTER TABLE "VendorSettlement"
ADD CONSTRAINT "VendorSettlement_amount_positive"
CHECK ("amount" > 0);

ALTER TABLE "VendorLedgerEntry"
ADD CONSTRAINT "VendorLedgerEntry_amount_positive"
CHECK ("amount" > 0);

ALTER TABLE "PlatformRevenueEntry"
ADD CONSTRAINT "PlatformRevenueEntry_amount_positive"
CHECK ("amount" > 0);

-- Allow only one default bank account per business.
CREATE UNIQUE INDEX "VendorBankAccount_one_default_per_business"
ON "VendorBankAccount" ("businessAccountId")
WHERE "isDefault" = true;
