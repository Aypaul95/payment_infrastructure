
import express from "express";
import { createHmac } from "node:crypto";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createPaystackWebhookRouter } from "../src/routes/paystack-webhook.routes";
import { randomUUID } from "node:crypto";

const webhookSecret = "webhook-test-secret";

process.env.PAYSTACK_SECRET_KEY = webhookSecret;

let prisma: any;
let server: Server;
let baseUrl: string;
let businessAccountId: string;

const confirmationCalls: string[] = [];

const app = express();

app.use(
  "/webhooks/paystack",
  express.raw({ type: "application/json", limit: "1mb" }),
  createPaystackWebhookRouter({
      confirmPayment: async (reference) => {
          confirmationCalls.push(reference);

          return {
              outcome: "SUCCESSFUL",
              paymentId: "test-payment-id",
              reference,
          };
      },
  }),
);

before(async () => {
  const databaseUrl = process.env.DATABASE_URL;

  assert.ok(databaseUrl, "DATABASE_URL must be configured");

  const parsedDatabaseUrl = new URL(databaseUrl);

  assert.equal(
    parsedDatabaseUrl.pathname,
    "/payment_infrastructure_test",
    "Webhook integration tests must use the test database",
  );

  const prismaModule = await import("../src/lib/prisma");
  prisma = prismaModule.prisma;

  const business = await prisma.businessAccount.create({
    data: {
      businessName: "Webhook Integration Test",
      email: `webhook-${randomUUID()}@example.com`,
      currency: "NGN",
    },
  });

  businessAccountId = business.id;

  server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Could not determine test server address"));
        return;
      }

      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  if (prisma && businessAccountId) {
    await prisma.payment.deleteMany({
      where: { businessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: businessAccountId },
    });

    await prisma.$disconnect();
  }
});

async function createPaymentRecord(reference: string) {
  return prisma.payment.create({
    data: {
      businessAccountId,
      idempotencyKey: `webhook-test-${randomUUID()}`,
      reference,
      amount: BigInt(5000),
      currency: "NGN",
      status: "PENDING",
    },
  });
}

function createSignature(body: Buffer): string {
  return createHmac("sha512", webhookSecret)
    .update(body)
    .digest("hex");
}

async function sendWebhook(data: {
  reference: string;
  amount: number;
  currency: string;
}) {
  const body = Buffer.from(
    JSON.stringify({
      event: "charge.success",
      data: {
        ...data,
        status: "success",
      },
    }),
  );

  return fetch(`${baseUrl}/webhooks/paystack`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": createSignature(body),
    },
    body,
  });
}

test("valid webhook confirms a matching pending payment", async () => {
  const reference = `webhook-valid-${randomUUID()}`;

  await createPaymentRecord(reference);

  const response = await sendWebhook({
    reference,
    amount: 5000,
    currency: "NGN",
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.message, "Payment confirmed.");
  assert.ok(confirmationCalls.includes(reference));
});

test("webhook with an incorrect amount is acknowledged for review", async () => {
  const reference = `webhook-amount-${randomUUID()}`;

  await createPaymentRecord(reference);

  const callsBefore = confirmationCalls.length;

  const response = await sendWebhook({
    reference,
    amount: 6000,
    currency: "NGN",
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.message, "Event acknowledged for review.");
  assert.equal(confirmationCalls.length, callsBefore);
});

test("webhook with an incorrect currency is acknowledged for review", async () => {
  const reference = `webhook-currency-${randomUUID()}`;

  await createPaymentRecord(reference);

  const callsBefore = confirmationCalls.length;

  const response = await sendWebhook({
    reference,
    amount: 5000,
    currency: "USD",
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.message, "Event acknowledged for review.");
  assert.equal(confirmationCalls.length, callsBefore);
});

test("duplicate webhook deliveries are acknowledged", async () => {
  const reference = `webhook-duplicate-${randomUUID()}`;

  await createPaymentRecord(reference);

  const firstResponse = await sendWebhook({
    reference,
    amount: 5000,
    currency: "NGN",
  });

  const secondResponse = await sendWebhook({
    reference,
    amount: 5000,
    currency: "NGN",
  });

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);

  // The router invokes confirmation for both deliveries.
  // Idempotency is handled by the payment confirmation service.
  assert.equal(
    confirmationCalls.filter((item) => item === reference).length,
    2,
  );
});