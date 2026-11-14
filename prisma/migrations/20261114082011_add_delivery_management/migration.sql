-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('REQUESTED', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryActorType" AS ENUM ('RIDER', 'BUSINESS_USER', 'ADMIN', 'SYSTEM');

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assignedRiderId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'REQUESTED',
    "pickupStreetAddress" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupLandmark" TEXT,
    "pickupLatitude" DECIMAL(10,7) NOT NULL,
    "pickupLongitude" DECIMAL(10,7) NOT NULL,
    "dropoffRecipientName" TEXT NOT NULL,
    "dropoffRecipientPhone" TEXT NOT NULL,
    "dropoffStreetAddress" TEXT NOT NULL,
    "dropoffCity" TEXT NOT NULL,
    "dropoffState" TEXT NOT NULL,
    "dropoffLandmark" TEXT,
    "dropoffLatitude" DECIMAL(10,7) NOT NULL,
    "dropoffLongitude" DECIMAL(10,7) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAssignmentHistory" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "previousRiderId" TEXT,
    "newRiderId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedByType" "DeliveryActorType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryStatusHistory" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "fromStatus" "DeliveryStatus",
    "toStatus" "DeliveryStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" "DeliveryActorType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE INDEX "Delivery_assignedRiderId_status_idx" ON "Delivery"("assignedRiderId", "status");

-- CreateIndex
CREATE INDEX "Delivery_status_requestedAt_idx" ON "Delivery"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "DeliveryAssignmentHistory_deliveryId_createdAt_idx" ON "DeliveryAssignmentHistory"("deliveryId", "createdAt");

-- CreateIndex
CREATE INDEX "DeliveryAssignmentHistory_newRiderId_createdAt_idx" ON "DeliveryAssignmentHistory"("newRiderId", "createdAt");

-- CreateIndex
CREATE INDEX "DeliveryStatusHistory_deliveryId_createdAt_idx" ON "DeliveryStatusHistory"("deliveryId", "createdAt");

-- CreateIndex
CREATE INDEX "DeliveryStatusHistory_actorId_createdAt_idx" ON "DeliveryStatusHistory"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_assignedRiderId_fkey" FOREIGN KEY ("assignedRiderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAssignmentHistory" ADD CONSTRAINT "DeliveryAssignmentHistory_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStatusHistory" ADD CONSTRAINT "DeliveryStatusHistory_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
