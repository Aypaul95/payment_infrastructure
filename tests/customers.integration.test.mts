
import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for integration tests.");
}

const databaseName = new URL(databaseUrl).pathname.slice(1);

if (databaseName !== "payment_infrastructure_test") {
  throw new Error(
    "Customer integration tests can only run against payment_infrastructure_test.",
  );
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma");
const { customerRouter } = await import("../src/routes/customer.routes");

let businessAccountId = "";
let businessUserId = "";
let secondBusinessAccountId = "";
let secondBusinessUserId = "";
let server: ReturnType<typeof app.listen>;
let baseUrl = "";

const app = express();
app.use(express.json());
app.use("/customers", customerRouter);

function createToken(userId: string, accountId: string) {
  return jwt.sign(
    {
      businessAccountId: accountId,
      role: "OWNER",
    },
    jwtSecret!,
    {
      subject: userId,
      expiresIn: "15m",
      issuer: "payment-infrastructure-api",
      audience: "payment-infrastructure-client",
    },
  );
}

function authHeaders(
  userId = businessUserId,
  accountId = businessAccountId,
) {
  return {
    Authorization: `Bearer ${createToken(userId, accountId)}`,
    "Content-Type": "application/json",
  };
}

async function createTestBusiness(name: string) {
  const business = await prisma.businessAccount.create({
    data: {
      businessName: name,
      email: `${randomUUID()}@example.com`,
    },
  });

  const user = await prisma.businessUser.create({
    data: {
      businessAccountId: business.id,
      fullName: "Customer Integration Test Owner",
      email: `${randomUUID()}@example.com`,
      passwordHash: "integration-test-password-hash",
      role: "OWNER",
    },
  });

  return {
    businessAccountId: business.id,
    businessUserId: user.id,
  };
}

async function createTestCustomer(
  accountId = businessAccountId,
  name = "Integration Test Customer",
) {
  return prisma.customer.create({
    data: {
      businessAccountId: accountId,
      name,
    },
  });
}

async function createTestPayment(
  accountId: string,
  customerId: string,
) {
  return prisma.payment.create({
    data: {
      businessAccountId: accountId,
      customerId,
      idempotencyKey: randomUUID(),
      reference: `TEST-PAY-${randomUUID()}`,
      amount: 250000n,
      currency: "NGN",
      status: "SUCCESSFUL",
      description: "Customer integration test payment",
    },
  });
}

before(async () => {
  const firstBusiness = await createTestBusiness(
    "Customer Integration Test Business",
  );

  businessAccountId = firstBusiness.businessAccountId;
  businessUserId = firstBusiness.businessUserId;

  const secondBusiness = await createTestBusiness(
    "Second Customer Integration Test Business",
  );

  secondBusinessAccountId = secondBusiness.businessAccountId;
  secondBusinessUserId = secondBusiness.businessUserId;

  server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to determine integration test server address.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  if (businessAccountId) {
    const customers = await prisma.customer.findMany({
      where: { businessAccountId },
      select: { id: true },
    });

    const customerIds = customers.map((customer) => customer.id);

    if (customerIds.length > 0) {
      const payments = await prisma.payment.findMany({
        where: { customerId: { in: customerIds } },
        select: { id: true },
      });

      const paymentIds = payments.map((payment) => payment.id);

      if (paymentIds.length > 0) {
        await prisma.paymentReconciliationAttempt.deleteMany({
          where: { paymentId: { in: paymentIds } },
        });
      }
    }

    await prisma.payment.deleteMany({
      where: { businessAccountId },
    });

    await prisma.customer.deleteMany({
      where: { businessAccountId },
    });

    await prisma.businessUser.deleteMany({
      where: { businessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: businessAccountId },
    });
  }

  if (secondBusinessAccountId) {
    const customers = await prisma.customer.findMany({
      where: { businessAccountId: secondBusinessAccountId },
      select: { id: true },
    });

    const customerIds = customers.map((customer) => customer.id);

    if (customerIds.length > 0) {
      const payments = await prisma.payment.findMany({
        where: { customerId: { in: customerIds } },
        select: { id: true },
      });

      const paymentIds = payments.map((payment) => payment.id);

      if (paymentIds.length > 0) {
        await prisma.paymentReconciliationAttempt.deleteMany({
          where: { paymentId: { in: paymentIds } },
        });
      }
    }

    await prisma.payment.deleteMany({
      where: { businessAccountId: secondBusinessAccountId },
    });

    await prisma.customer.deleteMany({
      where: { businessAccountId: secondBusinessAccountId },
    });

    await prisma.businessUser.deleteMany({
      where: { businessAccountId: secondBusinessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: secondBusinessAccountId },
    });
  }

  await prisma.$disconnect();
});

test("creates a customer and normalizes the email address", async () => {
  const response = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "Integration Test Customer",
      email: "CUSTOMER@EXAMPLE.COM",
      phone: "08012345678",
      reference: `CUSTOMER-${randomUUID()}`,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.message, "Customer created successfully.");
  assert.equal(body.data.name, "Integration Test Customer");
  assert.equal(body.data.email, "customer@example.com");
  assert.equal(body.data.businessAccountId, businessAccountId);
});

test("rejects a duplicate customer reference for the same business", async () => {
  const reference = `CUSTOMER-${randomUUID()}`;

  await prisma.customer.create({
    data: {
      businessAccountId,
      name: "Original Customer",
      reference,
    },
  });

  const response = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "Duplicate Customer",
      reference,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "This customer reference already exists for your business.",
  );
});

test("allows the same customer reference for different businesses", async () => {
  const reference = `SHARED-${randomUUID()}`;

  const firstResponse = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "First Business Customer",
      reference,
    }),
  });

  const secondResponse = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers: authHeaders(secondBusinessUserId, secondBusinessAccountId),
    body: JSON.stringify({
      name: "Second Business Customer",
      reference,
    }),
  });

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
});

test("lists customers belonging to the authenticated business", async () => {
  const customer = await createTestCustomer();

  const response = await fetch(`${baseUrl}/customers`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.count >= 1);
  assert.ok(
    body.data.some(
      (item: { id: string }) => item.id === customer.id,
    ),
  );
});

test("retrieves a customer belonging to the authenticated business", async () => {
  const customer = await createTestCustomer();

  const response = await fetch(`${baseUrl}/customers/${customer.id}`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, customer.id);
  assert.equal(body.data.name, customer.name);
});

test("does not expose another business's customer", async () => {
  const customer = await createTestCustomer(
    secondBusinessAccountId,
    "Private Business Customer",
  );

  const response = await fetch(`${baseUrl}/customers/${customer.id}`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.message, "Customer not found.");
});

test("updates a customer", async () => {
  const customer = await createTestCustomer();

  const response = await fetch(`${baseUrl}/customers/${customer.id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "Updated Customer Name",
      email: "UPDATED@EXAMPLE.COM",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "Customer updated successfully.");
  assert.equal(body.data.name, "Updated Customer Name");
  assert.equal(body.data.email, "updated@example.com");
});

test("rejects updating a customer with another customer's reference", async () => {
  const reference = `ORIGINAL-${randomUUID()}`;

  await prisma.customer.create({
    data: {
      businessAccountId,
      name: "Reference Owner",
      reference,
    },
  });

  const customer = await createTestCustomer();

  const response = await fetch(`${baseUrl}/customers/${customer.id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ reference }),
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "This customer reference already exists for your business.",
  );
});

test("deletes a customer without associated payments", async () => {
  const customer = await createTestCustomer();

  const response = await fetch(`${baseUrl}/customers/${customer.id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "Customer deleted successfully.");

  const deletedCustomer = await prisma.customer.findUnique({
    where: { id: customer.id },
  });

  assert.equal(deletedCustomer, null);
});

test("does not delete a customer with associated payments", async () => {
  const customer = await createTestCustomer();

  await createTestPayment(businessAccountId, customer.id);

  const response = await fetch(`${baseUrl}/customers/${customer.id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "This customer cannot be deleted because payment records are associated with them.",
  );
});

test("retrieves customer payment history and serializes amounts as strings", async () => {
  const customer = await createTestCustomer();

  const payment = await createTestPayment(
    businessAccountId,
    customer.id,
  );

  const response = await fetch(
    `${baseUrl}/customers/${customer.id}/payments`,
    { headers: authHeaders() },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.count >= 1);

  const returnedPayment = body.data.find(
    (item: { id: string }) => item.id === payment.id,
  );

  assert.ok(returnedPayment);
  assert.equal(returnedPayment.amount, "250000");
  assert.equal(returnedPayment.reference, payment.reference);
  assert.equal(returnedPayment.status, "SUCCESSFUL");
});

test("rejects invalid customer data", async () => {
  const response = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "X",
      email: "not-an-email",
      phone: "123",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Invalid customer data.");
  assert.ok(Array.isArray(body.errors));
});

test("rejects an empty customer update", async () => {
  const customer = await createTestCustomer();

  const response = await fetch(`${baseUrl}/customers/${customer.id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Invalid customer update data.");
  assert.ok(Array.isArray(body.errors));
});

test("rejects requests without an authentication token", async () => {
  const response = await fetch(`${baseUrl}/customers`);

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});