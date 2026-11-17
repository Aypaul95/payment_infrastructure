import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const CONFIRMATION_SECRET = process.env.DELIVERY_CONFIRMATION_SECRET;

if (!CONFIRMATION_SECRET || CONFIRMATION_SECRET.length < 32) {
  throw new Error(
    "DELIVERY_CONFIRMATION_SECRET must contain at least 32 characters.",
  );
}

const CODE_EXPIRY_MINUTES = 60;
const MAX_CONFIRMATION_ATTEMPTS = 5;

export function generateDeliveryConfirmationCode(): {
  code: string;
  hash: string;
  expiresAt: Date;
} {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

  const hash = createHmac("sha256", CONFIRMATION_SECRET!)
    .update(code)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000,
  );

  return { code, hash, expiresAt };
}

export function verifyDeliveryConfirmationCode(
  code: string,
  storedHash: string,
): boolean {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

    if (!/^[0-9a-fA-F]{64}$/.test(storedHash)) {
        return false;
    }

    const suppliedHash = createHmac("sha256", CONFIRMATION_SECRET!)
        .update(code)
        .digest();

    const expectedHash = Buffer.from(storedHash, "hex");

  if (expectedHash.length !== suppliedHash.length) {
    return false;
  }

  return timingSafeEqual(suppliedHash, expectedHash);
}

export const deliveryConfirmationLimits = {
  maxAttempts: MAX_CONFIRMATION_ATTEMPTS,
  expiryMinutes: CODE_EXPIRY_MINUTES,
};