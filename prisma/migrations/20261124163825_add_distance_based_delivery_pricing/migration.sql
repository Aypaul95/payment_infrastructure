-- CreateEnum
CREATE TYPE "DeliveryDistanceSource" AS ENUM ('STRAIGHT_LINE_ESTIMATE', 'ROAD_ROUTE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryDistanceKm" DECIMAL(10,3),
ADD COLUMN     "deliveryDistanceSource" "DeliveryDistanceSource",
ADD COLUMN     "deliveryFee" BIGINT,
ADD COLUMN     "pickupCity" TEXT,
ADD COLUMN     "pickupLandmark" TEXT,
ADD COLUMN     "pickupLatitude" DECIMAL(10,7),
ADD COLUMN     "pickupLongitude" DECIMAL(10,7),
ADD COLUMN     "pickupState" TEXT,
ADD COLUMN     "pickupStreetAddress" TEXT,
ADD COLUMN     "serviceFee" BIGINT,
ADD COLUMN     "serviceFeeRateBps" INTEGER;

-- CreateTable
CREATE TABLE "PlatformPricingConfig" (
    "id" TEXT NOT NULL,
    "deliveryBaseFee" BIGINT NOT NULL,
    "deliveryFeePerKm" BIGINT NOT NULL,
    "minimumDeliveryFee" BIGINT NOT NULL,
    "maximumDeliveryDistanceKm" DECIMAL(10,3) NOT NULL,
    "serviceFeeRateBps" INTEGER NOT NULL,
    "serviceFeeCap" BIGINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPricingConfig_pkey" PRIMARY KEY ("id")
);

-- Enforce valid platform pricing configuration.
ALTER TABLE "PlatformPricingConfig"
ADD CONSTRAINT "PlatformPricingConfig_default_id_check"
CHECK ("id" = 'default'),
ADD CONSTRAINT "PlatformPricingConfig_deliveryBaseFee_check"
CHECK ("deliveryBaseFee" >= 0),
ADD CONSTRAINT "PlatformPricingConfig_deliveryFeePerKm_check"
CHECK ("deliveryFeePerKm" >= 0),
ADD CONSTRAINT "PlatformPricingConfig_minimumDeliveryFee_check"
CHECK ("minimumDeliveryFee" >= 0),
ADD CONSTRAINT "PlatformPricingConfig_maximumDeliveryDistanceKm_check"
CHECK ("maximumDeliveryDistanceKm" > 0),
ADD CONSTRAINT "PlatformPricingConfig_serviceFeeRateBps_check"
CHECK ("serviceFeeRateBps" BETWEEN 0 AND 10000),
ADD CONSTRAINT "PlatformPricingConfig_serviceFeeCap_check"
CHECK ("serviceFeeCap" >= 0);
