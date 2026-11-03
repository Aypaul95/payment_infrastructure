
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { confirmPayment } from "./payment-confirmation.service";
import type { PaymentConfirmationResult } from "./payment-confirmation.service";

// 1. Define the retry delays after each reconciliation attempt.
//    After the 30-minute delay, subsequent retries use a 1-hour delay.
const RETRY_DELAYS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
];

// 2. Set the maximum number of reconciliation attempts.
const MAX_RECONCILIATION_ATTEMPTS = 10;

// 3. Stop automatic reconciliation after 24 hours.
const MAX_RECONCILIATION_AGE_MS = 24 * 60 * 60 * 1000;

// 4. Set the lease duration for a worker processing a payment.
//    If a worker crashes, another worker can reclaim the payment
//    after this duration expires.
const RECONCILIATION_LEASE_MS = 2 * 60 * 1000;

// 5. Define the outcomes that can be recorded in reconciliation history.
export type ReconciliationOutcome =
  | "SUCCESSFUL"
  | "STILL_PENDING"
  | "DETAILS_MISMATCH"
  | "PROVIDER_ERROR"
  | "NOT_FOUND"
  | "NOT_PENDING";

// 6. Define the result returned by the reconciliation service.
export type PaymentReconciliationResult = {
  paymentId: string;
  reference: string;
  outcome: ReconciliationOutcome;
  providerStatus?: string;
  errorCode?: string;
  nextReconciliationAt?: Date | null;
};

// 7. Define the structure of a payment selected for reconciliation.
export type ReconciliationPayment = {
  id: string;
  businessAccountId: string;
  reference: string;
  status: string;
  reconciliationAttempts: number;
  createdAt: Date;
  nextReconciliationAt: Date | null;
  reconciliationLockedUntil: Date | null;
  reconciliationLockToken: string | null;
};

// 8. Define the dependencies required to process one reconciliation.
//    These functions can use real database operations or test doubles.
export type ReconciliationDependencies = {
  claimNextPayment: () => Promise<ReconciliationPayment | null>;

  confirmPayment: (
    reference: string,
    businessAccountId: string,
  ) => Promise<PaymentConfirmationResult>;

  recordReconciliationAttempt: (
    payment: ReconciliationPayment,
    outcome: ReconciliationOutcome,
    now: Date,
    providerStatus?: string,
    errorCode?: string,
  ) => Promise<Date | null>;
};

// 9. Select the retry delay based on the attempt number.
//    Attempt 1 uses 5 minutes, attempt 2 uses 15 minutes,
//    attempt 3 uses 30 minutes, and later attempts use 1 hour.
function getRetryDelay(attempts: number): number {
  const retryIndex = Math.max(0, attempts - 1);

  return RETRY_DELAYS_MS[
    Math.min(retryIndex, RETRY_DELAYS_MS.length - 1)
  ];
}

// 10. Determine whether a payment has exceeded the reconciliation age limit.
function hasExceededReconciliationAge(
  createdAt: Date,
  now: Date,
): boolean {
  return now.getTime() - createdAt.getTime() >= MAX_RECONCILIATION_AGE_MS;
}

// 11. Claim one payment that is due for reconciliation.
//     PostgreSQL handles selection and locking atomically.
async function claimNextPayment(
  now: Date = new Date(),
): Promise<ReconciliationPayment | null> {
  // 11.1. Generate a unique token for this worker's claim.
  const lockToken = randomUUID();

  // 11.2. Calculate when the worker's lease expires.
  const lockedUntil = new Date(
    now.getTime() + RECONCILIATION_LEASE_MS,
  );

  // 11.3. Calculate the oldest payment that is still eligible.
  const oldestEligibleDate = new Date(
    now.getTime() - MAX_RECONCILIATION_AGE_MS,
  );

  // 11.4. Atomically select and claim one eligible payment.
  const claimedPayments = await prisma.$queryRaw<
    ReconciliationPayment[]
  >`
    WITH candidate AS (
      SELECT "id"
      FROM "Payment"
      WHERE "status" = 'PENDING'
        AND "nextReconciliationAt" <= ${now}
        AND (
          "reconciliationLockedUntil" IS NULL
          OR "reconciliationLockedUntil" <= ${now}
        )
        AND "reconciliationAttempts" < ${MAX_RECONCILIATION_ATTEMPTS}
        AND "createdAt" > ${oldestEligibleDate}
      ORDER BY "nextReconciliationAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "Payment" AS payment
    SET
      "reconciliationLockToken" = ${lockToken},
      "reconciliationLockedUntil" = ${lockedUntil},
      "reconciliationAttempts" =
        payment."reconciliationAttempts" + 1,
      "updatedAt" = ${now}
    FROM candidate
    WHERE payment."id" = candidate."id"
    RETURNING
      payment."id",
      payment."businessAccountId",
      payment."reference",
      payment."status",
      payment."reconciliationAttempts",
      payment."createdAt",
      payment."nextReconciliationAt",
      payment."reconciliationLockedUntil",
      payment."reconciliationLockToken"
  `;

  // 11.5. Return the claimed payment, or null if none was available.
  return claimedPayments[0] ?? null;
}

// 12. Convert a payment confirmation result into a reconciliation outcome.
function mapConfirmationOutcome(
  result: PaymentConfirmationResult,
): {
  outcome: ReconciliationOutcome;
  providerStatus?: string;
} {
  // 12.1. A confirmed payment is successful.
  if (result.outcome === "SUCCESSFUL") {
    return { outcome: "SUCCESSFUL" };
  }

  // 12.2. A payment that Paystack has not confirmed remains pending.
  if (result.outcome === "PENDING") {
    return {
      outcome: "STILL_PENDING",
      providerStatus: result.providerStatus,
    };
  }

  // 12.3. Preserve the remaining confirmation outcomes.
  return { outcome: result.outcome };
}

// 13. Record a reconciliation attempt and update its retry schedule.
async function recordReconciliationAttempt(
  payment: ReconciliationPayment,
  outcome: ReconciliationOutcome,
  now: Date,
  providerStatus?: string,
  errorCode?: string,
): Promise<Date | null> {
  // 13.1. Decide whether another reconciliation attempt is appropriate.
  const shouldRetry =
    outcome === "STILL_PENDING" ||
    outcome === "PROVIDER_ERROR";

  // 13.2. Check whether the payment is still within the retry limits.
  const canRetry =
    shouldRetry &&
    payment.reconciliationAttempts < MAX_RECONCILIATION_ATTEMPTS &&
    !hasExceededReconciliationAge(payment.createdAt, now);

  // 13.3. Calculate the next reconciliation time when another retry is allowed.
  const nextReconciliationAt = canRetry
    ? new Date(
        now.getTime() + getRetryDelay(payment.reconciliationAttempts),
      )
    : null;

  // 13.4. Save the audit record and release the lock in one transaction.
  await prisma.$transaction(async (transaction) => {
    // 13.5. Save the outcome of this reconciliation attempt.
    await transaction.paymentReconciliationAttempt.create({
      data: {
        paymentId: payment.id,
        outcome,
        providerStatus,
        errorCode,
        attemptedAt: now,
      },
    });

    // 13.6. Release the lock only if this worker still owns it.
    const released = await transaction.payment.updateMany({
      where: {
        id: payment.id,
        reconciliationLockToken: payment.reconciliationLockToken,
      },
      data: {
        reconciliationLockToken: null,
        reconciliationLockedUntil: null,
        nextReconciliationAt,
      },
    });

    // 13.7. Detect if the worker lost ownership of the payment.
    if (released.count !== 1) {
      throw new Error("RECONCILIATION_LOCK_LOST");
    }
  });

  // 13.8. Return the scheduled retry time, or null if no retry is scheduled.
  return nextReconciliationAt;
}

// 14. Create the real dependencies used by the application.
const defaultDependencies: ReconciliationDependencies = {
  claimNextPayment: () => claimNextPayment(),

  confirmPayment: (reference, businessAccountId) =>
    confirmPayment(reference, businessAccountId),

  recordReconciliationAttempt: (
    payment,
    outcome,
    now,
    providerStatus,
    errorCode,
  ) =>
    recordReconciliationAttempt(
      payment,
      outcome,
      now,
      providerStatus,
      errorCode,
    ),
};

// 15. Process one payment using the supplied dependencies.
//     Tests can supply fake dependencies without calling Paystack.
export async function processNextPaymentWithDependencies(
  dependencies: ReconciliationDependencies,
): Promise<PaymentReconciliationResult | null> {
  // 15.1. Claim one eligible payment from the database.
  const payment = await dependencies.claimNextPayment();

  // 15.2. Return null when no payment is available.
  if (!payment) {
    return null;
  }

  // 15.3. Capture the time when this attempt begins.
  const now = new Date();

  // 15.4. Store the confirmation result separately from error handling.
  let confirmation: PaymentConfirmationResult;

  try {
    // 15.5. Verify the payment using the confirmation dependency.
    confirmation = await dependencies.confirmPayment(
      payment.reference,
      payment.businessAccountId,
    );
  } catch (error) {
    // 15.6. Only confirmation errors reach this catch block.
    const errorCode =
      error instanceof Error
        ? error.message
        : "UNKNOWN_RECONCILIATION_ERROR";

    // 15.7. Record the provider error and schedule a retry if allowed.
    //       Database errors here will propagate instead of being caught again.
    const nextReconciliationAt =
      await dependencies.recordReconciliationAttempt(
        payment,
        "PROVIDER_ERROR",
        now,
        undefined,
        errorCode,
      );

    // 15.8. Return the provider-error result.
    return {
      paymentId: payment.id,
      reference: payment.reference,
      outcome: "PROVIDER_ERROR",
      errorCode,
      nextReconciliationAt,
    };
  }

  // 15.9. Map the confirmation result to a reconciliation outcome.
  const mapped = mapConfirmationOutcome(confirmation);

  // 15.10. Record the result and schedule another attempt if appropriate.
  //        Errors from this operation are not treated as provider errors.
  const nextReconciliationAt =
    await dependencies.recordReconciliationAttempt(
      payment,
      mapped.outcome,
      now,
      mapped.providerStatus,
    );

  // 15.11. Return the completed reconciliation result.
  return {
    paymentId: payment.id,
    reference: payment.reference,
    outcome: mapped.outcome,
    providerStatus: mapped.providerStatus,
    nextReconciliationAt,
  };
}

// 16. Process one payment using the real database and Paystack dependencies.
//     This is the function the future background worker will call.
export async function processNextPayment():
  Promise<PaymentReconciliationResult | null> {
  return processNextPaymentWithDependencies(defaultDependencies);
}

/**
 * Creates reconciliation dependencies that use the real database
 * operations but allow the payment provider call to be replaced.
 *
 * This is useful for integration testing without making real
 * requests to Paystack.
 * Uses the real PostgreSQL function to claim a payment.
*  Uses the real PostgreSQL function to record reconciliation attempts.
Allows our tests to simulate Paystack responses without contacting Paystack.
 */
export function createDatabaseReconciliationDependencies(
  confirmation: ReconciliationDependencies["confirmPayment"] = confirmPayment,
): ReconciliationDependencies {
  return {
    claimNextPayment: () => claimNextPayment(),

    confirmPayment: confirmation,

    recordReconciliationAttempt: (
      payment,
      outcome,
      now,
      providerStatus,
      errorCode,
    ) =>
      recordReconciliationAttempt(
        payment,
        outcome,
        now,
        providerStatus,
        errorCode,
      ),
  };
}