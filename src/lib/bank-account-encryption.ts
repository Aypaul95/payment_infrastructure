import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.BANK_ACCOUNT_ENCRYPTION_KEY;

  if (
    !encryptionKey ||
    !/^[0-9a-fA-F]{64}$/.test(encryptionKey)
  ) {
    throw new Error(
      "BANK_ACCOUNT_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.",
    );
  }

  return Buffer.from(encryptionKey, "hex");
}

export function encryptBankAccountNumber(
  accountNumber: string,
): string {
  if (!/^\d{10}$/.test(accountNumber)) {
    throw new Error("INVALID_BANK_ACCOUNT_NUMBER");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(accountNumber, "utf8"),
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

export function decryptBankAccountNumber(
  payload: string,
): string {
  const parts = payload.split(".");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("INVALID_ENCRYPTED_BANK_ACCOUNT");
  }

  const [, ivHex, authTagHex, encryptedHex] = parts;

  if (
    !/^[0-9a-fA-F]{24}$/.test(ivHex) ||
    !/^[0-9a-fA-F]{32}$/.test(authTagHex) ||
    !/^(?:[0-9a-fA-F]{2})+$/.test(encryptedHex)
  ) {
    throw new Error("INVALID_ENCRYPTED_BANK_ACCOUNT");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  const accountNumber = decrypted.toString("utf8");

  if (!/^\d{10}$/.test(accountNumber)) {
    throw new Error("INVALID_DECRYPTED_BANK_ACCOUNT");
  }

  return accountNumber;
}