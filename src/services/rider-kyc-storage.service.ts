import {
  mkdir,
  writeFile,
  unlink,
} from "node:fs/promises";
import path from "node:path";

const storageDirectory = path.resolve(
  process.env.KYC_STORAGE_DIR ?? "./private_storage/kyc",
);

export async function saveKycDocument(
  storageKey: string,
  buffer: Buffer,
): Promise<void> {
  await mkdir(storageDirectory, {
    recursive: true,
    mode: 0o700,
  });

  const destination = path.join(storageDirectory, storageKey);

  await writeFile(destination, buffer, {
    flag: "wx",
    mode: 0o600,
  });
}

export async function deleteKycDocument(
  storageKey: string,
): Promise<void> {
  const destination = path.join(storageDirectory, storageKey);

  try {
    await unlink(destination);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}
