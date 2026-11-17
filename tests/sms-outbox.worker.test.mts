
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  runSmsOutboxWorker,
} from "../src/workers/sms-outbox.worker.ts";

test("processes an SMS job returned by the processor", async () => {
  const controller = new AbortController();
  let processingCount = 0;

  await runSmsOutboxWorker(
    {
      processSms: async () => {
        processingCount++;
        controller.abort();
        return true;
      },

      onError: () => {
        assert.fail("No error should occur");
      },
    },
    controller.signal,
  );

  assert.equal(processingCount, 1);
});

test("waits when no SMS job is available", async () => {
  const controller = new AbortController();

  let waitCalled = false;

  await runSmsOutboxWorker(
    {
      processSms: async () => false,

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

  await runSmsOutboxWorker(
    {
      processSms: async () => {
        throw new Error("TEST_SMS_PROCESSING_ERROR");
      },

      onError: (error) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "TEST_SMS_PROCESSING_ERROR");
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

  await runSmsOutboxWorker(
    {
      processSms: async () => {
        processingCount++;
        controller.abort();
        return false;
      },
    },
    controller.signal,
  );

  assert.equal(processingCount, 1);
});