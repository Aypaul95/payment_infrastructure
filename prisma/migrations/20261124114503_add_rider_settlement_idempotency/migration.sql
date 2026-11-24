-- Add the idempotency key as nullable first.
ALTER TABLE "RiderSettlement"
ADD COLUMN "idempotencyKey" TEXT;

-- Give existing settlements unique legacy keys.
UPDATE "RiderSettlement"
SET "idempotencyKey" = 'legacy_' || "id"
WHERE "idempotencyKey" IS NULL;

-- Require an idempotency key for all future settlements.
ALTER TABLE "RiderSettlement"
ALTER COLUMN "idempotencyKey" SET NOT NULL;

-- Prevent duplicate settlement requests per rider.
CREATE UNIQUE INDEX "RiderSettlement_riderId_idempotencyKey_key"
ON "RiderSettlement"("riderId", "idempotencyKey");