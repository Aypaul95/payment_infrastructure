-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_businessAccountId_idx" ON "Customer"("businessAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessAccountId_reference_key" ON "Customer"("businessAccountId", "reference");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessAccountId_fkey" FOREIGN KEY ("businessAccountId") REFERENCES "BusinessAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
