
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  runReconciliationWorker,
} from "../src/workers/payment-reconciliation.worker.ts";

test("processes a payment returned by the processor", async () => {
  let processed = false;

  const controller = new AbortController();

  await runReconciliationWorker(
    {
      processPayment: async () => {
        controller.abort();

        return {
          paymentId: "payment-test-001",
          outcome: "SUCCESSFUL",
          nextReconciliationAt: null,
        } as Awaited<
            ReturnType<
                NonNullable<
                    NonNullable<
                        Parameters<typeof runReconciliationWorker>[0]
                    >["processPayment"]
                >
            >
        >;
      },

      onPaymentProcessed: (result) => {
        processed = true;
        assert.equal(result.paymentId, "payment-test-001");
        assert.equal(result.outcome, "SUCCESSFUL");
      },
    },
    controller.signal,
  );

  assert.equal(processed, true);
});

test("waits when no payment is available", async () => {
  const controller = new AbortController();

  let waitCalled = false;

  await runReconciliationWorker(
    {
      processPayment: async () => null,

      sleep: async (milliseconds) => {
        assert.equal(milliseconds, 5_000);
        waitCalled = true;
        controller.abort();
      },
    },
    controller.signal,
  );

  assert.equal(waitCalled, true);
});

test("handles processing errors and continues running", async () => {
  const controller = new AbortController();

  let errorHandled = false;

  await runReconciliationWorker(
    {
      processPayment: async () => {
        throw new Error("TEST_PROCESSING_ERROR");
      },

      onError: (error) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "TEST_PROCESSING_ERROR");
        errorHandled = true;
      },

      sleep: async (milliseconds) => {
        assert.equal(milliseconds, 5_000);
        controller.abort();
      },
    },
    controller.signal,
  );

  assert.equal(errorHandled, true);
});

test("stops when the abort signal is triggered", async () => {
  const controller = new AbortController();

  let processingCount = 0;

  await runReconciliationWorker(
    {
      processPayment: async () => {
        processingCount++;
        controller.abort();
        return null;
      },
    },
    controller.signal,
  );

  assert.equal(processingCount, 1);
});