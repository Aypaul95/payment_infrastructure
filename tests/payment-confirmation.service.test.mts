
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  confirmPaymentWithDependencies,
  type PaymentConfirmationResult,
} from "../src/services/payment-confirmation.service";

// ============================================================
// 1. CREATE MOCK DEPENDENCIES
// ============================================================

// This function creates a simulated payment record and fake
// database and Paystack operations.
//
// We use mock dependencies because we want to test the payment
// confirmation logic without contacting the real Paystack API
// or modifying actual database records.
//
// The options parameter allows individual tests to simulate
// different payment statuses and Paystack responses.
function createDependencies(options?: {
  status?: string;
  providerStatus?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  updatedCount?: number;
  latestStatus?: string;
}) {
  // Simulated payment record returned by the mock database.
  const payment = {
    id: "payment-test-001",
    businessAccountId: "business-test-001",
    reference: "PAY-TEST-001",
    amount: BigInt(5000),
    currency: "NGN",
    status: options?.status ?? "PENDING",
    orderId: null as string | null,
  };

  let verificationCalls = 0;
  let updateCalls = 0;
  let failureUpdateCalls = 0;

  const dependencies = {
    findFirst: async (): Promise<typeof payment | null> => payment,

    // Simulate the atomic payment-confirmation operation.
    confirmSuccessfulPayment: async () => {
      updateCalls++;

      // Simulate another process confirming the payment first.
      if (options?.updatedCount === 0) {
        if (options.latestStatus === "SUCCESSFUL") {
          return { outcome: "SUCCESSFUL" as const };
        }

        return {
          outcome: "NOT_PENDING" as const,
          currentStatus: options?.latestStatus ?? payment.status,
        };
      }

      payment.status = "SUCCESSFUL";

      return { outcome: "SUCCESSFUL" as const };
    },

    // Simulate the atomic payment-failure operation.
    markFailedPayment: async () => {
      failureUpdateCalls++;

      // Simulate another process changing the payment first.
      if (options?.updatedCount === 0) {
        return {
          outcome: "NOT_PENDING" as const,
          currentStatus: options?.latestStatus ?? payment.status,
        };
      }

      payment.status = "FAILED";

      return { outcome: "FAILED" as const };
    },

    // Simulate Paystack verification.
    verifyTransaction: async () => {
      verificationCalls++;

      return {
        reference: options?.reference ?? payment.reference,
        amount: options?.amount ?? 5000,
        currency: options?.currency ?? "NGN",
        status: options?.providerStatus ?? "success",
      };
    },
  };

  return {
    dependencies,
    getVerificationCalls: () => verificationCalls,
    getUpdateCalls: () => updateCalls,
    getFailureUpdateCalls: () => failureUpdateCalls,
  };
}

// ============================================================
// 2. TEST SUCCESSFUL PAYMENT CONFIRMATION
// ============================================================

// A pending payment should become successful when Paystack
// confirms that the transaction was completed successfully.
test("confirms a pending payment after successful provider verification", async () => {
  const setup = createDependencies();

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  // Confirm that the service returns the expected result.
  assert.deepEqual(result, {
    outcome: "SUCCESSFUL",
    paymentId: "payment-test-001",
    reference: "PAY-TEST-001",
  });

  // Paystack verification should happen exactly once.
  assert.equal(setup.getVerificationCalls(), 1);

  // The database update should also happen exactly once.
  assert.equal(setup.getUpdateCalls(), 1);
});

// ============================================================
// 3. TEST DUPLICATE PAYMENT CONFIRMATION
// ============================================================

// If a payment has already been marked SUCCESSFUL,
// the service should not contact Paystack or update it again.
//
// This is an important part of payment idempotency.
test("does not verify a payment that is already successful", async () => {
  const setup = createDependencies({
    status: "SUCCESSFUL",
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.equal(result.outcome, "SUCCESSFUL");

  // No additional Paystack verification should occur.
  assert.equal(setup.getVerificationCalls(), 0);

  // No additional database update should occur.
  assert.equal(setup.getUpdateCalls(), 0);
});

// ============================================================
// 4. TEST PAYMENT AMOUNT MISMATCH
// ============================================================

// The amount returned by Paystack must match the amount
// originally stored in our database.
//
// If the amounts differ, the payment must not be confirmed.
test("does not confirm a payment when provider amount differs", async () => {
  const setup = createDependencies({
    amount: 6000,
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.equal(result.outcome, "DETAILS_MISMATCH");

  // The database must not be updated.
  assert.equal(setup.getUpdateCalls(), 0);
});

// ============================================================
// 5. TEST PAYMENT CURRENCY MISMATCH
// ============================================================

// The currency returned by Paystack must match the currency
// stored in our database.
//
// For example, an NGN payment must not be confirmed using
// a provider response that reports USD.
test("does not confirm a payment when provider currency differs", async () => {
  const setup = createDependencies({
    currency: "USD",
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.equal(result.outcome, "DETAILS_MISMATCH");

  // No database update should take place.
  assert.equal(setup.getUpdateCalls(), 0);
});

// ============================================================
// 6. TEST PENDING PROVIDER TRANSACTION
// ============================================================

// Sometimes Paystack may report that a transaction is still
// pending rather than successful.
//
// In this situation, our payment must remain PENDING.
test("keeps payment pending when provider has not confirmed success", async () => {
  const setup = createDependencies({
    providerStatus: "pending",
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.equal(result.outcome, "PENDING");

  // A pending provider response must not trigger a successful
  // payment update.
  assert.equal(setup.getUpdateCalls(), 0);
});

// ============================================================
// 7. TEST FAILED PAYMENT
// ============================================================

// A payment with FAILED status must not go through the
// successful confirmation process again.
test("does not confirm a payment with a failed status", async () => {
  const setup = createDependencies({
    status: "FAILED",
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.deepEqual(result, {
    outcome: "NOT_PENDING",
    paymentId: "payment-test-001",
    reference: "PAY-TEST-001",
    currentStatus: "FAILED",
  });

  // Paystack should not be contacted for an already failed payment.
  assert.equal(setup.getVerificationCalls(), 0);
});

// ============================================================
// 8. TEST PAYMENT NOT FOUND
// ============================================================

// If the supplied payment reference does not exist in our
// database, the service should return NOT_FOUND.
test("returns NOT_FOUND when no payment exists", async () => {
  const setup = createDependencies();

  // Override the mock database search to simulate
  // a reference that does not exist.
  setup.dependencies.findFirst = async () => null;

  const result: PaymentConfirmationResult =
    await confirmPaymentWithDependencies(
      "MISSING-REFERENCE",
      setup.dependencies,
    );

  assert.deepEqual(result, {
    outcome: "NOT_FOUND",
  });

  // Paystack should not be contacted when no local payment exists.
  assert.equal(setup.getVerificationCalls(), 0);
});

// ============================================================
// 9. TEST CONCURRENT PAYMENT CONFIRMATION
// ============================================================

// Two requests might attempt to confirm the same payment
// at almost the same time.
//
// If another request updates the payment first, our updateMany
// operation returns count: 0.
//
// The service must then retrieve the latest status and recognise
// that the payment has already been confirmed successfully.
test("handles a concurrent confirmation by reading the latest status", async () => {
  const setup = createDependencies({
    updatedCount: 0,
    latestStatus: "SUCCESSFUL",
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.equal(result.outcome, "SUCCESSFUL");

  // Our update was attempted once but did not update a record.
  assert.equal(setup.getUpdateCalls(), 1);
});

// ============================================================
// TEST VERIFIED FAILED PAYMENT
// ============================================================

test("marks a pending payment as failed after provider verification", async () => {
  const setup = createDependencies({
    providerStatus: "failed",
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.deepEqual(result, {
    outcome: "FAILED",
    paymentId: "payment-test-001",
    reference: "PAY-TEST-001",
  });

  assert.equal(setup.getVerificationCalls(), 1);
  assert.equal(setup.getUpdateCalls(), 0);
  assert.equal(setup.getFailureUpdateCalls(), 1);
});

test("does not overwrite a concurrently successful payment with FAILED", async () => {
  const setup = createDependencies({
    providerStatus: "failed",
    updatedCount: 0,
    latestStatus: "SUCCESSFUL",
  });

  const result = await confirmPaymentWithDependencies(
    "PAY-TEST-001",
    setup.dependencies,
  );

  assert.deepEqual(result, {
    outcome: "NOT_PENDING",
    paymentId: "payment-test-001",
    reference: "PAY-TEST-001",
    currentStatus: "SUCCESSFUL",
  });

  assert.equal(setup.getVerificationCalls(), 1);
  assert.equal(setup.getFailureUpdateCalls(), 1);
});