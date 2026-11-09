
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  processNextPaymentWithDependencies,
  type ReconciliationDependencies,
  type ReconciliationPayment,
} from "../src/services/payment-reconciliation.service.ts";

import type { PaymentConfirmationResult } from "../src/services/payment-confirmation.service.ts";

// 1. Create sample payment data returned by the reconciliation claim.
const payment: ReconciliationPayment = {
  id: "payment-reconciliation-test-123",
  businessAccountId: "business-reconciliation-test-123",
  reference: "PAY-RECONCILIATION-TEST-123",
  status: "PENDING",
  reconciliationAttempts: 1,
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  nextReconciliationAt: new Date("2026-01-01T10:05:00.000Z"),
  reconciliationLockedUntil: new Date("2026-01-01T10:07:00.000Z"),
  reconciliationLockToken: "test-lock-token",
};

// 2. Create fake dependencies.
//    Each test can override only the functions it needs.
function createDependencies(
  overrides: Partial<ReconciliationDependencies> = {},
): ReconciliationDependencies {
  return {
    claimNextPayment: async () => payment,

    confirmPayment: async (): Promise<PaymentConfirmationResult> => ({
      outcome: "SUCCESSFUL",
      paymentId: payment.id,
      reference: payment.reference,
    }),

    recordReconciliationAttempt: async () => null,

    ...overrides,
  };
}

// TEST 1
// 3. Return null when no payment is eligible for reconciliation.
test("returns null when no payment is available to reconcile", async () => {
  const dependencies = createDependencies({
    claimNextPayment: async () => null,
  });

  const result = await processNextPaymentWithDependencies(dependencies);

  assert.equal(result, null);
});

// TEST 2
// 4. Return SUCCESSFUL when confirmation succeeds.
test("returns SUCCESSFUL when payment confirmation succeeds", async () => {
  let recordCalls = 0;
  let recordedOutcome: string | undefined;

  const dependencies = createDependencies({
    recordReconciliationAttempt: async (_payment, outcome) => {
      recordCalls++;
      recordedOutcome = outcome;
      return null;
    },
  });

  const result = await processNextPaymentWithDependencies(dependencies);

  assert.deepEqual(result, {
    paymentId: payment.id,
    reference: payment.reference,
    outcome: "SUCCESSFUL",
    providerStatus: undefined,
    nextReconciliationAt: null,
  });

  assert.equal(recordCalls, 1);
  assert.equal(recordedOutcome, "SUCCESSFUL");
});

// TEST 3
// 5. Record STILL_PENDING when the provider has not confirmed success.
test("records STILL_PENDING when provider confirmation is pending", async () => {
  let recordedOutcome: string | undefined;
  let recordedProviderStatus: string | undefined;

  const dependencies = createDependencies({
    confirmPayment: async (): Promise<PaymentConfirmationResult> => ({
      outcome: "PENDING",
      paymentId: payment.id,
      reference: payment.reference,
      providerStatus: "pending",
    }),

    recordReconciliationAttempt: async (
      _payment,
      outcome,
      _now,
      providerStatus,
    ) => {
      recordedOutcome = outcome;
      recordedProviderStatus = providerStatus;
      return new Date("2026-01-01T10:20:00.000Z");
    },
  });

  const result = await processNextPaymentWithDependencies(dependencies);

  assert.equal(result?.outcome, "STILL_PENDING");
  assert.equal(result?.providerStatus, "pending");
  assert.equal(recordedOutcome, "STILL_PENDING");
  assert.equal(recordedProviderStatus, "pending");
  assert.ok(result?.nextReconciliationAt instanceof Date);
});

// TEST 4
// 6. Record PROVIDER_ERROR when confirmation throws an error.
test("records PROVIDER_ERROR when confirmation throws", async () => {
  let recordedOutcome: string | undefined;
  let recordedErrorCode: string | undefined;

  const dependencies = createDependencies({
    confirmPayment: async () => {
      throw new Error("PAYSTACK_REQUEST_TIMEOUT");
    },

    recordReconciliationAttempt: async (
      _payment,
      outcome,
      _now,
      _providerStatus,
      errorCode,
    ) => {
      recordedOutcome = outcome;
      recordedErrorCode = errorCode;
      return null;
    },
  });

  const result = await processNextPaymentWithDependencies(dependencies);

  assert.deepEqual(result, {
    paymentId: payment.id,
    reference: payment.reference,
    outcome: "PROVIDER_ERROR",
    errorCode: "PAYSTACK_REQUEST_TIMEOUT",
    nextReconciliationAt: null,
  });

  assert.equal(recordedOutcome, "PROVIDER_ERROR");
  assert.equal(recordedErrorCode, "PAYSTACK_REQUEST_TIMEOUT");
});

// TEST 5
// 7. Do not misclassify database/audit errors as provider errors.
test("propagates reconciliation-recording errors", async () => {
  const dependencies = createDependencies({
    recordReconciliationAttempt: async () => {
      throw new Error("DATABASE_RECORDING_FAILED");
    },
  });

  await assert.rejects(
    processNextPaymentWithDependencies(dependencies),
    { message: "DATABASE_RECORDING_FAILED" },
  );
});

// TEST 6
// 8. Preserve DETAILS_MISMATCH returned by the confirmation service.
test("preserves DETAILS_MISMATCH from payment confirmation", async () => {
  let recordedOutcome: string | undefined;

  const dependencies = createDependencies({
    confirmPayment: async (): Promise<PaymentConfirmationResult> => ({
      outcome: "DETAILS_MISMATCH",
      paymentId: payment.id,
      reference: payment.reference,
    }),

    recordReconciliationAttempt: async (_payment, outcome) => {
      recordedOutcome = outcome;
      return null;
    },
  });

  const result = await processNextPaymentWithDependencies(dependencies);

  assert.equal(result?.outcome, "DETAILS_MISMATCH");
  assert.equal(recordedOutcome, "DETAILS_MISMATCH");
});
// TEST 7
// 9. Preserve DUPLICATE_CHARGE and do not schedule another reconciliation.
test("records DUPLICATE_CHARGE without scheduling a retry", async () => {
  let recordedOutcome: string | undefined;
  let recordedRetryTime: Date | null | undefined;

  const dependencies = createDependencies({
    confirmPayment: async (): Promise<PaymentConfirmationResult> => ({
      outcome: "DUPLICATE_CHARGE",
      paymentId: payment.id,
      reference: payment.reference,
      orderId: "order-reconciliation-test-123",
      orderStatus: "CANCELLED",
    }),

    recordReconciliationAttempt: async (
      _payment,
      outcome,
      _now,
    ) => {
      recordedOutcome = outcome;
      recordedRetryTime = null;
      return null;
    },
  });

  const result = await processNextPaymentWithDependencies(dependencies);

  assert.equal(result?.outcome, "DUPLICATE_CHARGE");
  assert.equal(recordedOutcome, "DUPLICATE_CHARGE");
  assert.equal(recordedRetryTime, null);
  assert.equal(result?.nextReconciliationAt, null);
});
