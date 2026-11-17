import { prisma } from "../lib/prisma";
import { randomUUID } from "node:crypto";
import { decryptSmsPayload } from "../lib/sms-encryption";
import { smsProvider } from "../lib/sms";

const RETRY_DELAYS_MS = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
];

const SMS_PROCESSING_LEASE_MS = 2 * 60 * 1000;

export type SmsOutboxJob = {
  id: string;
  deliveryId: string;
  recipientPhone: string;
  encryptedPayload: string;
  attempts: number;
  maxAttempts: number;
  lockedAt: Date | null;
  lockToken: string | null;
};

export type SmsOutboxDependencies = {
  claimNextJob: () => Promise<SmsOutboxJob | null>;
  sendSms: (
    recipientPhone: string,
    message: string,
  ) => Promise<void>;
  markSent: (job: SmsOutboxJob) => Promise<void>;
  markFailed: (
    job: SmsOutboxJob,
    now: Date,
  ) => Promise<void>;
};

async function claimNextSmsJob(
  now: Date = new Date(),
): Promise<SmsOutboxJob | null> {

  const lockToken = randomUUID();
  const lockedAt = now;
  const staleLockTime = new Date(
    now.getTime() - SMS_PROCESSING_LEASE_MS,
  );

  const claimedJobs = await prisma.$queryRaw<SmsOutboxJob[]>`
    WITH candidate AS (
      SELECT "id"
      FROM "SmsOutbox"
      WHERE
        "attempts" < "maxAttempts"
        AND "nextAttemptAt" <= ${now}
        AND (
          "status" = 'PENDING'
          OR (
            "status" = 'PROCESSING'
            AND (
  "lockedAt" IS NULL
  OR "lockedAt" <= ${staleLockTime}
)
          )
        )
      ORDER BY "nextAttemptAt" ASC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "SmsOutbox" AS job
    SET
      "status" = 'PROCESSING',
      "lockedAt" = ${lockedAt},
      "lockToken" = ${lockToken},
      "attempts" = job."attempts" + 1,
      "updatedAt" = ${now}
    FROM candidate
    WHERE job."id" = candidate."id"
    RETURNING
      job."id",
      job."deliveryId",
      job."recipientPhone",
      job."encryptedPayload",
      job."attempts",
      job."maxAttempts",
      job."lockedAt",
      job."lockToken"
  `;

  return claimedJobs[0] ?? null;
}

async function markSmsJobSent(job: SmsOutboxJob): Promise<void> {
  await prisma.smsOutbox.updateMany({
    where: {
      id: job.id,
      status: "PROCESSING",
      lockToken: job.lockToken,
    },
    data: {
      status: "SENT",
      sentAt: new Date(),
      lockedAt: null,
      lockToken: null,
      lastError: null,
    },
  });
}

async function markSmsJobFailed(
  job: SmsOutboxJob,
  now: Date,
): Promise<void> {
  const exhausted = job.attempts >= job.maxAttempts;

  const retryDelay = RETRY_DELAYS_MS[job.attempts - 1] ?? 0;

  await prisma.smsOutbox.updateMany({
    where: {
      id: job.id,
      status: "PROCESSING",
      lockToken: job.lockToken,
    },
    data: {
      status: exhausted ? "FAILED" : "PENDING",
      nextAttemptAt: exhausted
        ? now
        : new Date(now.getTime() + retryDelay),
      lockedAt: null,
      lockToken: null,
      lastError: "SMS_DELIVERY_FAILED",
    },
  });
}

async function recoverExhaustedSmsJobs(
  now: Date = new Date(),
): Promise<void> {
  const staleLockTime = new Date(
    now.getTime() - SMS_PROCESSING_LEASE_MS,
  );

  await prisma.$executeRaw`
    UPDATE "SmsOutbox"
    SET
      "status" = 'FAILED',
      "lockedAt" = NULL,
      "lockToken" = NULL,
      "lastError" = 'SMS_DELIVERY_FAILED',
      "updatedAt" = ${now}
    WHERE
      "status" = 'PROCESSING'
      AND "attempts" >= "maxAttempts"
      AND (
        "lockedAt" IS NULL
        OR "lockedAt" <= ${staleLockTime}
      )
  `;
}
export async function processNextSmsOutboxJobWithDependencies(
    dependencies: SmsOutboxDependencies,
): Promise<boolean> {
    const job = await dependencies.claimNextJob();

    if (!job) {
        return false;
    }

    let message: string;

    try {
        message = decryptSmsPayload(job.encryptedPayload);
        await dependencies.sendSms(job.recipientPhone, message);
    } catch {
        await dependencies.markFailed(job, new Date());
        return true;
    }

    await dependencies.markSent(job);

    return true;
}

export async function processNextSmsOutboxJob(): Promise<boolean> {
  await recoverExhaustedSmsJobs();

  return processNextSmsOutboxJobWithDependencies({
    claimNextJob: claimNextSmsJob,
    sendSms: async (to, message) => {
      await smsProvider.send({ to, message });
    },
    markSent: markSmsJobSent,
    markFailed: markSmsJobFailed,
  });
}