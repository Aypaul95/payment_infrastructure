
import { test } from "node:test";
import assert from "node:assert/strict";

import { confirmPaymentWithDependencies } from "../src/services/payment-confirmation.service.ts";

// 1. Create sample payment data used by the tests.
const payment = {
  id: "payment-test-123",
  businessAccountId: "business-test-123",
  reference: "PAY-TEST-123",
  amount: 50000n,
  currency: "NGN",
  status: "PENDING",
};

// 2. Create a sample successful Paystack verification response.
const successfulPaystackResponse = {
  reference: "PAY-TEST-123",
  amount: 50000,
  currency: "NGN",
  status: "success",
};

// 3. Create fake dependencies for testing.
//    Individual tests can override these functions when necessary.
type Dependencies = Parameters<
  typeof confirmPaymentWithDependencies
>[1];

function createDependencies(
  overrides: Partial<Dependencies> = {},
): Dependencies {
  return {
    findFirst: async () => payment,
    updateMany: async () => ({ count: 1 }),
    findUnique: async () => ({ status: "SUCCESSFUL" }),
    verifyTransaction: async () => successfulPaystackResponse,
    ...overrides,
  };
}

// TEST 1
// 4. Check that NOT_FOUND is returned when no payment exists.
test("returns NOT_FOUND when the payment reference does not exist", async () => {
  const dependencies = createDependencies({
    findFirst: async () => null,
  });

  const result = await confirmPaymentWithDependencies(
    "UNKNOWN-REFERENCE",
    dependencies,
  );

  assert.deepEqual(result, {
    outcome: "NOT_FOUND",
  });
});

// TEST 2
// 5. Check that an already successful payment is not verified again.
test("returns SUCCESSFUL without contacting Paystack when already confirmed", async () => {
  let verificationCalls = 0;

  const dependencies = createDependencies({
    findFirst: async () => ({
      ...payment,
      status: "SUCCESSFUL",
    }),

    verifyTransaction: async () => {
      verificationCalls++;
      return successfulPaystackResponse;
    },
  });

  const result = await confirmPaymentWithDependencies(
    payment.reference,
    dependencies,
  );

  assert.deepEqual(result, {
    outcome: "SUCCESSFUL",
    paymentId: payment.id,
    reference: payment.reference,
  });

  assert.equal(verificationCalls, 0);
});

// TEST 3
// 6. Check that payments with FAILED status cannot be confirmed.
test("returns NOT_PENDING when the payment has FAILED status", async () => {
  let verificationCalls = 0;

  const dependencies = createDependencies({
    findFirst: async () => ({
      ...payment,
      status: "FAILED",
    }),

    verifyTransaction: async () => {
      verificationCalls++;
      return successfulPaystackResponse;
    },
  });

  const result = await confirmPaymentWithDependencies(
    payment.reference,
    dependencies,
  );

  assert.deepEqual(result, {
    outcome: "NOT_PENDING",
    paymentId: payment.id,
    reference: payment.reference,
    currentStatus: "FAILED",
  });

  assert.equal(verificationCalls, 0);
});

// TEST 4
// 7. Check that a payment remains pending when Paystack reports pending.
test("keeps the payment pending when Paystack has not confirmed success", async () => {
  let updateCalls = 0;

  const dependencies = createDependencies({
    verifyTransaction: async () => ({
      ...successfulPaystackResponse,
      status: "pending",
    }),

    updateMany: async () => {
      updateCalls++;
      return { count: 1 };
    },
  });

  const result = await confirmPaymentWithDependencies(
    payment.reference,
    dependencies,
  );

  assert.deepEqual(result, {
    outcome: "PENDING",
    paymentId: payment.id,
    reference: payment.reference,
    providerStatus: "pending",
  });

  assert.equal(updateCalls, 0);
});

// TEST 5
// 8. Check that a successful Paystack verification updates the database.
test("marks the payment SUCCESSFUL when Paystack confirms the transaction", async () => {
  let updateCalls = 0;
  let receivedUpdateArguments: unknown;

  const dependencies = createDependencies({
    updateMany: async (args) => {
      updateCalls++;
      receivedUpdateArguments = args;
      return { count: 1 };
    },
  });

  const result = await confirmPaymentWithDependencies(
    payment.reference,
    dependencies,
  );

  assert.deepEqual(result, {
    outcome: "SUCCESSFUL",
    paymentId: payment.id,
    reference: payment.reference,
  });

  assert.equal(updateCalls, 1);

  assert.deepEqual(receivedUpdateArguments, {
    where: {
      id: payment.id,
      businessAccountId: payment.businessAccountId,
      status: "PENDING",
    },
    data: {
      status: "SUCCESSFUL",
    },
  });
});

// TEST 6
// 9. Check that a different amount reported by Paystack is rejected.
test("returns DETAILS_MISMATCH when Paystack reports a different amount", async () => {
  let updateCalls = 0;

  const dependencies = createDependencies({
    verifyTransaction: async () => ({
      ...successfulPaystackResponse,
      amount: 60000,
    }),

    updateMany: async () => {
      updateCalls++;
      return { count: 1 };
    },
  });

  const result = await confirmPaymentWithDependencies(
    payment.reference,
    dependencies,
  );

  assert.deepEqual(result, {
    outcome: "DETAILS_MISMATCH",
    paymentId: payment.id,
    reference: payment.reference,
  });

  assert.equal(updateCalls, 0);
});

// TEST 7
// 10. Check that concurrent confirmation is handled safely.
//     If another request updates the payment first, this request checks
//     the latest database status before returning its result.
test("handles concurrent confirmation when another request succeeds first", async () => {
  let updateCalls = 0;
  let findUniqueCalls = 0;

  const dependencies = createDependencies({
    updateMany: async () => {
      updateCalls++;
      return { count: 0 };
    },

    findUnique: async () => {
      findUniqueCalls++;
      return { status: "SUCCESSFUL" };
    },
  });

  const result = await confirmPaymentWithDependencies(
    payment.reference,
    dependencies,
  );

  assert.deepEqual(result, {
    outcome: "SUCCESSFUL",
    paymentId: payment.id,
    reference: payment.reference,
  });

  assert.equal(updateCalls, 1);
  assert.equal(findUniqueCalls, 1);
});