
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
    "Inventory integration tests can only run against payment_infrastructure_test.",
  );
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma");
const { inventoryRouter } = await import("../src/routes/inventory.routes");

let businessAccountId = "";
let businessUserId = "";
let secondBusinessAccountId = "";
let secondBusinessUserId = "";
let server: ReturnType<typeof app.listen>;
let baseUrl = "";
let productId = "";
let secondBusinessProductId = "";

const app = express();
app.use(express.json());
app.use("/inventory", inventoryRouter);

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

function authHeaders(userId = businessUserId, accountId = businessAccountId) {
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
      fullName: "Inventory Integration Test Owner",
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

async function createTestProduct(accountId: string, name: string) {
  return prisma.product.create({
    data: {
      businessAccountId: accountId,
      name,
      sku: `SKU-${randomUUID()}`,
      price: 100000n,
    },
  });
}

before(async () => {
  const firstBusiness = await createTestBusiness(
    "Inventory Integration Test Business",
  );

  businessAccountId = firstBusiness.businessAccountId;
  businessUserId = firstBusiness.businessUserId;

  const secondBusiness = await createTestBusiness(
    "Second Inventory Integration Test Business",
  );

  secondBusinessAccountId = secondBusiness.businessAccountId;
  secondBusinessUserId = secondBusiness.businessUserId;

  const firstProduct = await createTestProduct(
    businessAccountId,
    "Inventory Integration Test Product",
  );

  productId = firstProduct.id;

  const secondProduct = await createTestProduct(
    secondBusinessAccountId,
    "Second Business Inventory Product",
  );

  secondBusinessProductId = secondProduct.id;

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

  const productIds = [productId, secondBusinessProductId].filter(Boolean);

  if (productIds.length > 0) {
    await prisma.inventoryMovement.deleteMany({
      where: { productId: { in: productIds } },
    });

    await prisma.inventory.deleteMany({
      where: { productId: { in: productIds } },
    });

    await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });
  }

  if (businessAccountId) {
    await prisma.businessUser.deleteMany({
      where: { businessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: businessAccountId },
    });
  }

  if (secondBusinessAccountId) {
    await prisma.businessUser.deleteMany({
      where: { businessAccountId: secondBusinessAccountId },
    });

    await prisma.businessAccount.delete({
      where: { id: secondBusinessAccountId },
    });
  }

  await prisma.$disconnect();
});

test("stock-in creates inventory and records a movement", async () => {
  const response = await fetch(`${baseUrl}/inventory/${productId}/stock-in`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantity: 20,
      reason: "Initial stock",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "Stock added successfully.");
  assert.equal(body.data.productId, productId);
  assert.equal(body.data.quantity, 20);

  const movement = await prisma.inventoryMovement.findFirst({
    where: { productId },
  });

  assert.ok(movement);
  assert.equal(movement.type, "STOCK_IN");
  assert.equal(movement.quantity, 20);
  assert.equal(movement.reason, "Initial stock");
});

test("stock-out decreases inventory and records a movement", async () => {
  const response = await fetch(`${baseUrl}/inventory/${productId}/stock-out`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantity: 5,
      reason: "Sale",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "Stock removed successfully.");
  assert.equal(body.data.quantity, 15);

  const movement = await prisma.inventoryMovement.findFirst({
    where: {
      productId,
      type: "STOCK_OUT",
    },
  });

  assert.ok(movement);
  assert.equal(movement.quantity, 5);
  assert.equal(movement.reason, "Sale");
});

test("rejects stock-out when available quantity is insufficient", async () => {
  const response = await fetch(`${baseUrl}/inventory/${productId}/stock-out`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantity: 100,
      reason: "Attempted sale",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(body.message, "Insufficient stock.");

  const inventory = await prisma.inventory.findUnique({
    where: { productId },
  });

  assert.equal(inventory?.quantity, 15);
});

test("stock-out rejects a product with no inventory record", async () => {
  const response = await fetch(
    `${baseUrl}/inventory/${secondBusinessProductId}/stock-out`,
    {
      method: "POST",
      headers: authHeaders(secondBusinessUserId, secondBusinessAccountId),
      body: JSON.stringify({ quantity: 1 }),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(body.message, "Insufficient stock.");
});

test("lists inventory for the authenticated business only", async () => {
  const response = await fetch(`${baseUrl}/inventory`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.some((item: { productId: string }) => item.productId === productId));
  assert.ok(
    !body.data.some(
      (item: { productId: string }) =>
        item.productId === secondBusinessProductId,
    ),
  );
});

test("retrieves inventory for a product owned by the business", async () => {
  const response = await fetch(`${baseUrl}/inventory/${productId}`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.productId, productId);
  assert.equal(body.data.quantity, 15);
});

test("does not expose another business's inventory", async () => {
  const response = await fetch(
    `${baseUrl}/inventory/${secondBusinessProductId}`,
    {
      headers: authHeaders(),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.message, "Inventory not found.");
});

test("lists inventory movement history", async () => {
  const response = await fetch(
    `${baseUrl}/inventory/${productId}/movements`,
    {
      headers: authHeaders(),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.count, 2);
  assert.equal(body.data[0].type, "STOCK_OUT");
  assert.equal(body.data[1].type, "STOCK_IN");
});

test("rejects invalid stock movement data", async () => {
  const response = await fetch(`${baseUrl}/inventory/${productId}/stock-in`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantity: -5,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Invalid stock movement data.");
  assert.ok(Array.isArray(body.errors));
});

test("rejects requests without an authentication token", async () => {
  const response = await fetch(`${baseUrl}/inventory`);

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});
