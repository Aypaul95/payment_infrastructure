import { prisma } from "../lib/prisma";
import { validateKycFile } from "./rider-kyc-file.service";
import {
  saveKycDocument,
  deleteKycDocument,
} from "./rider-kyc-storage.service";
import type { createRiderKycSubmissionSchema } from "../validators/rider-kyc.validator";
import type { z } from "zod";

type CreateKycInput = z.infer<
  typeof createRiderKycSubmissionSchema
>;

export async function createRiderKycSubmission(
  riderId: string,
  input: CreateKycInput,
  buffer: Buffer,
) {
  const validatedFile = validateKycFile(buffer);

  await saveKycDocument(
    validatedFile.storageKey,
    buffer,
  );

  try {
    return await prisma.riderKycSubmission.create({
      data: {
        riderId,
        documentType: input.documentType,
        documentStorageKey: validatedFile.storageKey,
      },
      select: {
        id: true,
        documentType: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    try {
      await deleteKycDocument(validatedFile.storageKey);
    } catch (cleanupError) {
      console.error(
        "Failed to clean up KYC document after database error:",
        cleanupError,
      );
    }

    throw error;
  }
}

export async function listRiderKycSubmissions(riderId: string) {
  return prisma.riderKycSubmission.findMany({
    where: {
      riderId,
    },
    orderBy: {
      submittedAt: "desc",
    },
    select: {
      id: true,
      documentType: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
    },
  });
}
