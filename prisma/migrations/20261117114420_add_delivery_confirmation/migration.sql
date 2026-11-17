-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "confirmationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "confirmationCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "confirmationCodeHash" TEXT,
ADD COLUMN     "confirmationVerifiedAt" TIMESTAMP(3);
