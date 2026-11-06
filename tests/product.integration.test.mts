
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
    "Product integration tests can only run against payment_infrastructure_test.",
  );
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma");
const { productRouter } = await import("../src/routes/product.routes");

let businessAccountId = "";
let businessUserId = "";
let secondBusinessAccountId = "";
let secondBusinessUserId = "";
let server: ReturnType<typeof app.listen>;
let baseUrl = "";

const app = express();
app.use(express.json());
app.use("/products", productRouter);

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
      fullName: "Product Integration Test Owner",
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

before(async () => {
  const firstBusiness = await createTestBusiness(
    "Product Integration Test Business",
  );

  businessAccountId = firstBusiness.businessAccountId;
  businessUserId = firstBusiness.businessUserId;

  const secondBusiness = await createTestBusiness(
    "Second Product Integration Test Business",
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
    await prisma.product.deleteMany({
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
    await prisma.product.deleteMany({
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

test("creates a product and serializes its price as a string", async () => {
  const response = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "Integration Test Product",
      description: "A product created during integration testing.",
      sku: `SKU-${randomUUID()}`,
      price: 250000,
      currency: "ngn",
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.message, "Product created successfully.");
  assert.equal(body.data.name, "Integration Test Product");
  assert.equal(body.data.businessAccountId, businessAccountId);
  assert.equal(body.data.price, "250000");
  assert.equal(body.data.currency, "NGN");
});

test("lists products belonging to the authenticated business", async () => {
  const sku = `SKU-${randomUUID()}`;

  await prisma.product.create({
    data: {
      businessAccountId,
      name: "List Test Product",
      sku,
      price: 50000n,
    },
  });

  const response = await fetch(`${baseUrl}/products`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.count >= 1);
  assert.ok(body.data.some((product: { sku: string }) => product.sku === sku));
});

test("retrieves a product belonging to the authenticated business", async () => {
  const product = await prisma.product.create({
    data: {
      businessAccountId,
      name: "Get Test Product",
      sku: `SKU-${randomUUID()}`,
      price: 100000n,
    },
  });

  const response = await fetch(`${baseUrl}/products/${product.id}`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, product.id);
  assert.equal(body.data.price, "100000");
});

test("does not expose another business's product", async () => {
  const product = await prisma.product.create({
    data: {
      businessAccountId: secondBusinessAccountId,
      name: "Private Business Product",
      sku: `SKU-${randomUUID()}`,
      price: 150000n,
    },
  });

  const response = await fetch(`${baseUrl}/products/${product.id}`, {
    headers: authHeaders(),
  });

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.message, "Product not found.");
});

test("rejects a duplicate SKU for the same business", async () => {
  const sku = `SKU-${randomUUID()}`;

  await prisma.product.create({
    data: {
      businessAccountId,
      name: "Original SKU Product",
      sku,
      price: 100000n,
    },
  });

  const response = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "Duplicate SKU Product",
      sku,
      price: 200000,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "This product SKU already exists for your business.",
  );
});

test("rejects invalid product data", async () => {
  const response = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: "X",
      sku: "",
      price: -10,
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Invalid product data.");
  assert.ok(Array.isArray(body.errors));
});

test("rejects requests without an authentication token", async () => {
  const response = await fetch(`${baseUrl}/products`);

  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});