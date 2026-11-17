
import { test } from "node:test";
import assert from "node:assert/strict";

// Set the test encryption key before importing the service.
process.env.SMS_ENCRYPTION_KEY = "a".repeat(64);

const { encryptSmsPayload } = await import(
  "../src/lib/sms-encryption"
);

const {
  processNextSmsOutboxJobWithDependencies,
} = await import("../src/services/sms-outbox.service");

const job = {
  id: "sms-test-001",
  deliveryId: "delivery-test-001",
  recipientPhone: "2348012345678",
  encryptedPayload: encryptSmsPayload(
    "PAYINFRA: Your confirmation code is 123456.",
  ),
  attempts: 1,
  maxAttempts: 5,
  lockedAt: new Date(),
  lockToken: "test-lock-token",
};

test("returns false when no SMS job is available", async () => {
  let sendCalled = false;

  const result = await processNextSmsOutboxJobWithDependencies({
    claimNextJob: async () => null,

    sendSms: async () => {
      sendCalled = true;
    },

    markSent: async () => {},
    markFailed: async () => {},
  });

  assert.equal(result, false);
  assert.equal(sendCalled, false);
});

test("decrypts and sends an SMS, then marks the job as sent", async () => {
  let sentMessage: string | null = null;
  let sentRecipient: string | null = null;
  let markedSent = false;
  let markedFailed = false;

  const result = await processNextSmsOutboxJobWithDependencies({
    claimNextJob: async () => job,

    sendSms: async (recipient, message) => {
      sentRecipient = recipient;
      sentMessage = message;
    },

    markSent: async (claimedJob) => {
      assert.equal(claimedJob.id, job.id);
      markedSent = true;
    },

    markFailed: async () => {
      markedFailed = true;
    },
  });

  assert.equal(result, true);
  assert.equal(sentRecipient, job.recipientPhone);
  assert.equal(
    sentMessage,
    "PAYINFRA: Your confirmation code is 123456.",
  );
  assert.equal(markedSent, true);
  assert.equal(markedFailed, false);
});

test("marks the job as failed when SMS sending fails", async () => {
  let markedFailed = false;
  let markedSent = false;

  const result = await processNextSmsOutboxJobWithDependencies({
    claimNextJob: async () => job,

    sendSms: async () => {
      throw new Error("SMS_PROVIDER_FAILURE");
    },

    markSent: async () => {
      markedSent = true;
    },

    markFailed: async (failedJob, now) => {
      assert.equal(failedJob.id, job.id);
      assert.ok(now instanceof Date);
      markedFailed = true;
    },
  });

  assert.equal(result, true);
  assert.equal(markedFailed, true);
  assert.equal(markedSent, false);
});

test("marks the job as failed when the encrypted payload is invalid", async () => {
  let markedFailed = false;

  const invalidJob = {
    ...job,
    encryptedPayload: "invalid-payload",
  };

  const result = await processNextSmsOutboxJobWithDependencies({
    claimNextJob: async () => invalidJob,

    sendSms: async () => {
      assert.fail("SMS must not be sent for an invalid payload");
    },

    markSent: async () => {},

    markFailed: async (failedJob) => {
      assert.equal(failedJob.id, invalidJob.id);
      markedFailed = true;
    },
  });

  assert.equal(result, true);
  assert.equal(markedFailed, true);
});

test("propagates markSent database errors without marking the job failed", async () => {
  let markedFailed = false;

  await assert.rejects(
    processNextSmsOutboxJobWithDependencies({
      claimNextJob: async () => job,

      sendSms: async () => {},

      markSent: async () => {
        throw new Error("DATABASE_UPDATE_FAILURE");
      },

      markFailed: async () => {
        markedFailed = true;
      },
    }),
    { message: "DATABASE_UPDATE_FAILURE" },
  );

  assert.equal(markedFailed, false);
});

test("propagates database errors when marking a failed SMS job", async () => {
  await assert.rejects(
    processNextSmsOutboxJobWithDependencies({
      claimNextJob: async () => job,

      sendSms: async () => {
        throw new Error("SMS_PROVIDER_FAILURE");
      },

      markSent: async () => {},

      markFailed: async () => {
        throw new Error("DATABASE_UPDATE_FAILURE");
      },
    }),
    { message: "DATABASE_UPDATE_FAILURE" },
  );
});
