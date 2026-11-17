
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ENCRYPTION_KEY = process.env.SMS_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || !/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
  throw new Error(
    "SMS_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.",
  );
}

const key = Buffer.from(ENCRYPTION_KEY, "hex");
const ALGORITHM = "aes-256-gcm";

export function encryptSmsPayload(plaintext: string): string {
  if (!plaintext.trim()) {
    throw new Error("SMS_PAYLOAD_CANNOT_BE_EMPTY");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(".");
}

export function decryptSmsPayload(payload: string): string {
  const parts = payload.split(".");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("INVALID_ENCRYPTED_SMS_PAYLOAD");
  }

  const [, ivHex, authTagHex, encryptedHex] = parts;

  if (
    !/^[0-9a-fA-F]{24}$/.test(ivHex) ||
    !/^[0-9a-fA-F]{32}$/.test(authTagHex) ||
    !/^(?:[0-9a-fA-F]{2})+$/.test(encryptedHex)
  ) {
    throw new Error("INVALID_ENCRYPTED_SMS_PAYLOAD");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}