import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DELIVERY_CONFIRMATION_SECRET = "test-secret-for-delivery-confirmation-123456";

const {
  generateDeliveryConfirmationCode,
  verifyDeliveryConfirmationCode,
  deliveryConfirmationLimits,
} = await import("../src/services/delivery-confirmation.service.ts");

test("generates a six-digit delivery confirmation code", () => {
  const result = generateDeliveryConfirmationCode();

  assert.match(result.code, /^\d{6}$/);
  assert.match(result.hash, /^[0-9a-f]{64}$/);
  assert.ok(result.expiresAt instanceof Date);
});

test("sets confirmation code expiry to 60 minutes", () => {
  const before = Date.now();
  const result = generateDeliveryConfirmationCode();
  const after = Date.now();

  const expectedDuration = 60 * 60 * 1000;

  assert.ok(
    result.expiresAt.getTime() >= before + expectedDuration,
  );
  assert.ok(
    result.expiresAt.getTime() <= after + expectedDuration,
  );
  assert.equal(deliveryConfirmationLimits.expiryMinutes, 60);
});

test("allows a valid delivery confirmation code", () => {
  const result = generateDeliveryConfirmationCode();

  assert.equal(
    verifyDeliveryConfirmationCode(result.code, result.hash),
    true,
  );
});

test("rejects an incorrect delivery confirmation code", () => {
  const result = generateDeliveryConfirmationCode();

  const incorrectCode = result.code === "000000" ? "000001" : "000000";

  assert.equal(
    verifyDeliveryConfirmationCode(incorrectCode, result.hash),
    false,
  );
});

test("rejects malformed confirmation codes", () => {
  const result = generateDeliveryConfirmationCode();

  assert.equal(
    verifyDeliveryConfirmationCode("12345", result.hash),
    false,
  );

  assert.equal(
    verifyDeliveryConfirmationCode("1234567", result.hash),
    false,
  );

  assert.equal(
    verifyDeliveryConfirmationCode("abcdef", result.hash),
    false,
  );
});

test("rejects malformed stored confirmation hashes", () => {
  assert.equal(
    verifyDeliveryConfirmationCode("123456", "invalid-hash"),
    false,
  );

  assert.equal(
    verifyDeliveryConfirmationCode("123456", "a".repeat(63)),
    false,
  );
});

test("allows no more than five confirmation attempts", () => {
  assert.equal(deliveryConfirmationLimits.maxAttempts, 5);
});