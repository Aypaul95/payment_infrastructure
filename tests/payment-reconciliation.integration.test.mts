
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

// Import application services only after the database safety check.
const { prisma } = await import("../src/lib/prisma.ts");
const { createPayment } = await import("../src/services/payment.service.ts");

const {
  createDatabaseReconciliationDependencies,
  processNextPaymentWithDependencies,
} = await import("../src/services/payment-reconciliation.service.ts");

type ConfirmationFunction = NonNullable<
  Parameters<typeof createDatabaseReconciliationDependencies>[0]
>;

let businessAccountId: string;
let customerId: string;

const createdPaymentIds: string[] = [];

before(async () => {
  const business = await prisma.businessAccount.create({
    data: {
      businessName: "Reconciliation Integration Test Business",
      email: `reconciliation-${randomUUID()}@example.com`,
    },
  });

  businessAccountId = business.id;

  const customer = await prisma.customer.create({
    data: {
      businessAccountId,
      name: "Reconciliation Integration Customer",
      email: `reconciliation-customer-${randomUUID()}@example.com`,
    },
  });

  customerId = customer.id;
});

after(async () => {
  if (createdPaymentIds.length > 0) {
    await prisma.paymentReconciliationAttempt.deleteMany({
      where: {
        paymentId: { in: createdPaymentIds },
      },
    });

    await prisma.payment.deleteMany({
      where: {
        id: { in: createdPaymentIds },
      },
    });
  }

  if (businessAccountId) {
    await prisma.customer.deleteMany({
      where: { businessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: businessAccountId },
    });
  }

  await prisma.$disconnect();
});

/**
 * Creates a real payment and makes it due for reconciliation.
 */
async function createDuePayment() {
  const payment = await createPayment(businessAccountId, {
    idempotencyKey: `reconciliation-${randomUUID()}`,
    customerId,
    amount: "5000",
    currency: "NGN" as const,
    description: "Reconciliation integration test",
  });

  createdPaymentIds.push(payment.id);

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      nextReconciliationAt: new Date(Date.now() - 60_000),
    },
  });

  return payment;
}

/**
 * Creates dependencies using real database operations
 * and a simulated payment-provider response.
 */
function createTestDependencies(
  confirmation: ConfirmationFunction,
) {
  return createDatabaseReconciliationDependencies(confirmation);
}

test("claims a due payment and records a successful reconciliation", async () => {
  const payment = await createDuePayment();

  const fakeConfirmation = async () =>
    ({ outcome: "SUCCESSFUL" }) as Awaited<
      ReturnType<ConfirmationFunction>
    >;

  const result = await processNextPaymentWithDependencies(
    createTestDependencies(fakeConfirmation),
  );

  assert.ok(result);
  assert.equal(result.paymentId, payment.id);
  assert.equal(result.outcome, "SUCCESSFUL");

  const storedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  assert.ok(storedPayment);
  assert.equal(storedPayment.reconciliationAttempts, 1);
  assert.equal(storedPayment.reconciliationLockToken, null);
  assert.equal(storedPayment.reconciliationLockedUntil, null);

  const attempts = await prisma.paymentReconciliationAttempt.count({
    where: { paymentId: payment.id },
  });

  assert.equal(attempts, 1);
});

test("records a pending result and schedules another reconciliation attempt", async () => {
  const payment = await createDuePayment();

  const fakeConfirmation = async () =>
    ({ outcome: "PENDING" }) as Awaited<
      ReturnType<ConfirmationFunction>
    >;

  const result = await processNextPaymentWithDependencies(
    createTestDependencies(fakeConfirmation),
  );

  assert.ok(result);
  assert.equal(result.paymentId, payment.id);
  assert.equal(result.outcome, "STILL_PENDING");

  const storedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  assert.ok(storedPayment);
  assert.equal(storedPayment.reconciliationAttempts, 1);
  assert.equal(storedPayment.reconciliationLockToken, null);
  assert.equal(storedPayment.reconciliationLockedUntil, null);
  assert.ok(storedPayment.nextReconciliationAt);
  assert.ok(storedPayment.nextReconciliationAt > new Date());

  const attempts = await prisma.paymentReconciliationAttempt.count({
    where: { paymentId: payment.id },
  });

  assert.equal(attempts, 1);
});

test("records a provider error and schedules another attempt", async () => {
  const payment = await createDuePayment();

  const fakeConfirmation = async () => {
    throw new Error("PAYSTACK_REQUEST_TIMEOUT");
  };

  const result = await processNextPaymentWithDependencies(
    createTestDependencies(fakeConfirmation),
  );

  assert.ok(result);
  assert.equal(result.paymentId, payment.id);
  assert.equal(result.outcome, "PROVIDER_ERROR");

  const storedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  assert.ok(storedPayment);
  assert.equal(storedPayment.reconciliationAttempts, 1);
  assert.equal(storedPayment.reconciliationLockToken, null);
  assert.equal(storedPayment.reconciliationLockedUntil, null);
  assert.ok(storedPayment.nextReconciliationAt);
  assert.ok(storedPayment.nextReconciliationAt > new Date());

  const attempts = await prisma.paymentReconciliationAttempt.count({
    where: { paymentId: payment.id },
  });

  assert.equal(attempts, 1);
});

test("does not claim a payment while another worker holds an active lease", async () => {
  const payment = await createDuePayment();

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      reconciliationLockToken: randomUUID(),
      reconciliationLockedUntil: new Date(Date.now() + 5 * 60_000),
    },
  });

  const fakeConfirmation = async () =>
    ({ outcome: "SUCCESSFUL" }) as Awaited<
      ReturnType<ConfirmationFunction>
    >;

  const result = await processNextPaymentWithDependencies(
    createTestDependencies(fakeConfirmation),
  );

  assert.equal(result, null);

  const storedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  assert.ok(storedPayment);
  assert.equal(storedPayment.reconciliationAttempts, 0);

  const attempts = await prisma.paymentReconciliationAttempt.count({
    where: { paymentId: payment.id },
  });

  assert.equal(attempts, 0);
});

test("reclaims a payment whose previous worker lease has expired", async () => {
  const payment = await createDuePayment();

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      reconciliationLockToken: randomUUID(),
      reconciliationLockedUntil: new Date(Date.now() - 60_000),
    },
  });

  const fakeConfirmation = async () =>
    ({ outcome: "SUCCESSFUL" }) as Awaited<
      ReturnType<ConfirmationFunction>
    >;

  const result = await processNextPaymentWithDependencies(
    createTestDependencies(fakeConfirmation),
  );

  assert.ok(result);
  assert.equal(result.paymentId, payment.id);
  assert.equal(result.outcome, "SUCCESSFUL");

  const storedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  assert.ok(storedPayment);
  assert.equal(storedPayment.reconciliationAttempts, 1);
  assert.equal(storedPayment.reconciliationLockToken, null);
  assert.equal(storedPayment.reconciliationLockedUntil, null);

  const attempts = await prisma.paymentReconciliationAttempt.count({
    where: { paymentId: payment.id },
  });

  assert.equal(attempts, 1);
});