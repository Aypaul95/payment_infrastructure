-- CreateEnum
CREATE TYPE "RiderVehicleType" AS ENUM ('MOTORCYCLE', 'CAR', 'VAN', 'BICYCLE');

-- CreateEnum
CREATE TYPE "RiderKycDocumentType" AS ENUM ('NIN', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'INTERNATIONAL_PASSPORT', 'VOTERS_CARD');

-- CreateEnum
CREATE TYPE "RiderKycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiderKycReviewDecision" AS ENUM ('VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "RiderVehicle" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "vehicleType" "RiderVehicleType" NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "color" TEXT,
    "registrationNumber" TEXT,
    "year" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderKycSubmission" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "documentType" "RiderKycDocumentType" NOT NULL,
    "documentStorageKey" TEXT NOT NULL,
    "status" "RiderKycStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderKycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderKycReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "decision" "RiderKycReviewDecision" NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderKycReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiderVehicle_registrationNumber_key" ON "RiderVehicle"("registrationNumber");

-- CreateIndex
CREATE INDEX "RiderVehicle_riderId_isActive_idx" ON "RiderVehicle"("riderId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RiderKycSubmission_documentStorageKey_key" ON "RiderKycSubmission"("documentStorageKey");

-- CreateIndex
CREATE INDEX "RiderKycSubmission_riderId_status_idx" ON "RiderKycSubmission"("riderId", "status");

-- CreateIndex
CREATE INDEX "RiderKycSubmission_documentType_status_idx" ON "RiderKycSubmission"("documentType", "status");

-- CreateIndex
CREATE INDEX "RiderKycReview_submissionId_createdAt_idx" ON "RiderKycReview"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "RiderKycReview_reviewedBy_createdAt_idx" ON "RiderKycReview"("reviewedBy", "createdAt");

-- AddForeignKey
ALTER TABLE "RiderVehicle" ADD CONSTRAINT "RiderVehicle_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderKycSubmission" ADD CONSTRAINT "RiderKycSubmission_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderKycReview" ADD CONSTRAINT "RiderKycReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "RiderKycSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
