-- CreateEnum
CREATE TYPE "RiderBankAccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "RiderWalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'PAYOUT', 'REVERSAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RiderSettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RiderBankAccount" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "encryptedAccountNumber" TEXT NOT NULL,
    "maskedAccountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "recipientCode" TEXT,
    "status" "RiderBankAccountStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderWallet" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "availableBalance" BIGINT NOT NULL DEFAULT 0,
    "reservedBalance" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderWalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "RiderWalletTransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderSettlement" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "RiderSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "paystackTransferCode" TEXT,
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiderBankAccount_riderId_key" ON "RiderBankAccount"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderBankAccount_recipientCode_key" ON "RiderBankAccount"("recipientCode");

-- CreateIndex
CREATE INDEX "RiderBankAccount_status_idx" ON "RiderBankAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RiderWallet_riderId_key" ON "RiderWallet"("riderId");

-- CreateIndex
CREATE INDEX "RiderWallet_currency_idx" ON "RiderWallet"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "RiderWalletTransaction_reference_key" ON "RiderWalletTransaction"("reference");

-- CreateIndex
CREATE INDEX "RiderWalletTransaction_walletId_createdAt_idx" ON "RiderWalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "RiderWalletTransaction_type_createdAt_idx" ON "RiderWalletTransaction"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RiderSettlement_reference_key" ON "RiderSettlement"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "RiderSettlement_paystackTransferCode_key" ON "RiderSettlement"("paystackTransferCode");

-- CreateIndex
CREATE INDEX "RiderSettlement_riderId_status_createdAt_idx" ON "RiderSettlement"("riderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RiderSettlement_status_createdAt_idx" ON "RiderSettlement"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "RiderBankAccount" ADD CONSTRAINT "RiderBankAccount_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderWallet" ADD CONSTRAINT "RiderWallet_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderWalletTransaction" ADD CONSTRAINT "RiderWalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "RiderWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderSettlement" ADD CONSTRAINT "RiderSettlement_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderSettlement" ADD CONSTRAINT "RiderSettlement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "RiderWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderSettlement" ADD CONSTRAINT "RiderSettlement_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "RiderBankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
