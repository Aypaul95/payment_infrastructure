
import { test } from "node:test";
import assert from "node:assert/strict";

// Set a test-only encryption key before importing the module.
process.env.SMS_ENCRYPTION_KEY = "a".repeat(64);

const {
  encryptSmsPayload,
  decryptSmsPayload,
} = await import("../src/lib/sms-encryption");

// 1. Test encryption and decryption.
test("encrypts and decrypts an SMS payload correctly", () => {
  const message =
    "PAYINFRA: Your delivery confirmation code is 123456.";

  const encrypted = encryptSmsPayload(message);
  const decrypted = decryptSmsPayload(encrypted);

  assert.notEqual(encrypted, message);
  assert.equal(decrypted, message);
});

// 2. Test that separate encryptions use different initialization vectors.
test("generates different encrypted payloads for the same message", () => {
  const message = "Delivery confirmation code: 123456.";

  const first = encryptSmsPayload(message);
  const second = encryptSmsPayload(message);

  assert.notEqual(first, second);
  assert.equal(decryptSmsPayload(first), message);
  assert.equal(decryptSmsPayload(second), message);
});

// 3. Test tamper detection.
test("rejects an SMS payload whose ciphertext has been modified", () => {
  const encrypted = encryptSmsPayload("Confirmation code: 123456.");
  const parts = encrypted.split(".");

  const ciphertext = parts[3];
  const replacement = ciphertext[0] === "0" ? "1" : "0";

  parts[3] = replacement + ciphertext.slice(1);

  assert.throws(() => decryptSmsPayload(parts.join(".")));
});

// 4. Test malformed encrypted payloads.
test("rejects malformed encrypted SMS payloads", () => {
  assert.throws(
    () => decryptSmsPayload("invalid-payload"),
    { message: "INVALID_ENCRYPTED_SMS_PAYLOAD" },
  );
});

// 5. Test empty messages.
test("rejects empty SMS payloads", () => {
  assert.throws(
    () => encryptSmsPayload("   "),
    { message: "SMS_PAYLOAD_CANNOT_BE_EMPTY" },
  );
});
