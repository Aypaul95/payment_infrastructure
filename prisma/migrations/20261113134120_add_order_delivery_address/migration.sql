/*
  Warnings:

  - Added the required column `customerAddressId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryLatitude` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryLongitude` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryRecipientName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryRecipientPhone` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryState` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryStreetAddress` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerAddressId" TEXT NOT NULL,
ADD COLUMN     "deliveryCity" TEXT NOT NULL,
ADD COLUMN     "deliveryLandmark" TEXT,
ADD COLUMN     "deliveryLatitude" DECIMAL(10,7) NOT NULL,
ADD COLUMN     "deliveryLongitude" DECIMAL(10,7) NOT NULL,
ADD COLUMN     "deliveryRecipientName" TEXT NOT NULL,
ADD COLUMN     "deliveryRecipientPhone" TEXT NOT NULL,
ADD COLUMN     "deliveryState" TEXT NOT NULL,
ADD COLUMN     "deliveryStreetAddress" TEXT NOT NULL;
