-- AlterTable
ALTER TABLE "BusinessAccount" ADD COLUMN     "pickupCity" TEXT,
ADD COLUMN     "pickupLandmark" TEXT,
ADD COLUMN     "pickupLatitude" DECIMAL(10,7),
ADD COLUMN     "pickupLongitude" DECIMAL(10,7),
ADD COLUMN     "pickupState" TEXT,
ADD COLUMN     "pickupStreetAddress" TEXT;
