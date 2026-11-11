import { randomUUID } from "node:crypto";

export const MAX_KYC_FILE_SIZE = 5 * 1024 * 1024;

type ValidatedKycFile = {
  storageKey: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
};

export function validateKycFile(
  buffer: Buffer,
): ValidatedKycFile {
  if (buffer.length === 0 || buffer.length > MAX_KYC_FILE_SIZE) {
    throw new Error("INVALID_KYC_FILE_SIZE");
  }

  let extension: string;
  let mimeType: ValidatedKycFile["mimeType"];

  // PDF: %PDF-
  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  ) {
    extension = "pdf";
    mimeType = "application/pdf";
  }
  // JPEG: FF D8 FF
  else if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    extension = "jpg";
    mimeType = "image/jpeg";
  }
  // PNG signature
  else if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    extension = "png";
    mimeType = "image/png";
  } else {
    throw new Error("UNSUPPORTED_KYC_FILE_TYPE");
  }

  return {
    storageKey: `${randomUUID()}.${extension}`,
    mimeType,
  };
}
