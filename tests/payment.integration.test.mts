import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const parsedDatabaseUrl = new URL(databaseUrl);

if (parsedDatabaseUrl.pathname !== "/payment_infrastructure_test") {
  throw new Error(
    "SAFETY CHECK FAILED: Integration tests must use payment_infrastructure_test.",
  );
}

// Import Prisma and the payment service only after checking the database URL.
const { prisma } = await import("../src/lib/prisma.ts");
const { createPayment } = await import("../src/services/payment.service.ts");

let businessAccountId: string;
let customerId: string;
let secondBusinessAccountId: string;
let secondCustomerId: string;

before(async () => {
  const business = await prisma.businessAccount.create({
    data: {
      businessName: "Payment Integration Test Business",
      email: `integration-${randomUUID()}@example.com`,
    },
  });

  businessAccountId = business.id;

  const customer = await prisma.customer.create({
    data: {
      businessAccountId,
      name: "Integration Test Customer",
      email: `customer-${randomUUID()}@example.com`,
    },
  });

  customerId = customer.id;

    const secondBusiness = await prisma.businessAccount.create({
        data: {
            businessName: "Second Integration Test Business",
            email: `integration-second-${randomUUID()}@example.com`,
        },
    });

    secondBusinessAccountId = secondBusiness.id;

    const secondCustomer = await prisma.customer.create({
        data: {
            businessAccountId: secondBusinessAccountId,
            name: "Second Integration Test Customer",
            email: `customer-second-${randomUUID()}@example.com`,
        },
    });

    secondCustomerId = secondCustomer.id;
});

after(async () => {
  if (businessAccountId) {
    await prisma.payment.deleteMany({
      where: { businessAccountId },
    });

    await prisma.customer.deleteMany({
      where: { businessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: businessAccountId },
    });
  }
    if (secondBusinessAccountId) {
        await prisma.payment.deleteMany({
            where: { businessAccountId: secondBusinessAccountId },
        });

        await prisma.customer.deleteMany({
            where: { businessAccountId: secondBusinessAccountId },
        });

        await prisma.businessAccount.delete({
            where: { id: secondBusinessAccountId },
        });
    }

  await prisma.$disconnect();
});

test("creates and stores a payment in PostgreSQL", async () => {
  const payment = await createPayment(businessAccountId, {
    idempotencyKey: `create-${randomUUID()}`,
    customerId,
    amount: "5000",
    currency: "NGN" as const,
    description: "Integration test payment",
  });

  assert.equal(payment.businessAccountId, businessAccountId);
  assert.equal(payment.customerId, customerId);
  assert.equal(payment.amount, 5000n);
  assert.equal(payment.currency, "NGN");
  assert.equal(payment.status, "PENDING");

  const storedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  assert.ok(storedPayment);
  assert.equal(storedPayment.amount, 5000n);
});

test("returns the existing payment for the same idempotency key and details", async () => {
  const input = {
    idempotencyKey: `duplicate-${randomUUID()}`,
    customerId,
    amount: "7500",
    currency: "NGN" as const,
    description: "Duplicate request test",
  };

  const firstPayment = await createPayment(businessAccountId, input);
  const secondPayment = await createPayment(businessAccountId, input);

  assert.equal(secondPayment.id, firstPayment.id);

  const paymentCount = await prisma.payment.count({
    where: {
      businessAccountId,
      idempotencyKey: input.idempotencyKey,
    },
  });

  assert.equal(paymentCount, 1);
});

test("rejects reuse of an idempotency key with different payment details", async () => {
  const idempotencyKey = `conflict-${randomUUID()}`;

  await createPayment(businessAccountId, {
    idempotencyKey,
    customerId,
    amount: "5000",
    currency: "NGN" as const,
    description: "Original request",
  });

  await assert.rejects(
    createPayment(businessAccountId, {
      idempotencyKey,
      customerId,
      amount: "9000",
      currency: "NGN",
      description: "Original request",
    }),
    { message: "IDEMPOTENCY_KEY_REUSED" },
  );
});

test("does not create duplicate payments for simultaneous identical requests", async () => {
  const input = {
    idempotencyKey: `concurrent-${randomUUID()}`,
    customerId,
    amount: "12000",
    currency: "NGN" as const,
    description: "Concurrent request test",
  };

  const [firstPayment, secondPayment] = await Promise.all([
    createPayment(businessAccountId, input),
    createPayment(businessAccountId, input),
  ]);

  assert.equal(firstPayment.id, secondPayment.id);

  const paymentCount = await prisma.payment.count({
    where: {
      businessAccountId,
      idempotencyKey: input.idempotencyKey,
    },
  });

  assert.equal(paymentCount, 1);
});

test("rejects a payment using a customer belonging to another business", async () => {
  const idempotencyKey = `foreign-customer-${randomUUID()}`;

  await assert.rejects(
    createPayment(businessAccountId, {
      idempotencyKey,
      customerId: secondCustomerId,
      amount: "5000",
      currency: "NGN" as const,
      description: "Foreign customer test",
    }),
    { message: "CUSTOMER_NOT_FOUND" },
  );

  const paymentCount = await prisma.payment.count({
    where: {
      businessAccountId,
      idempotencyKey,
    },
  });

  assert.equal(paymentCount, 0);
});