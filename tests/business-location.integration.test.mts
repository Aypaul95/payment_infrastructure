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
    "Business location integration tests can only run against payment_infrastructure_test.",
  );
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

const { prisma } = await import("../src/lib/prisma");
const { businessLocationRouter } = await import(
  "../src/routes/business-location.routes"
);

let businessAccountId = "";
let businessUserId = "";
let secondBusinessAccountId = "";
let secondBusinessUserId = "";
let server: ReturnType<typeof app.listen>;
let baseUrl = "";

const app = express();
app.use(express.json());
app.use("/business-accounts", businessLocationRouter);

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
      fullName: "Business Location Integration Test Owner",
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

function validPickupLocation(overrides: Record<string, unknown> = {}) {
  return {
    pickupStreetAddress: "15 Unity Road",
    pickupCity: "Ilorin",
    pickupState: "Kwara",
    pickupLandmark: "Near Central Market",
    pickupLatitude: 8.4966,
    pickupLongitude: 4.5421,
    ...overrides,
  };
}

before(async () => {
  const firstBusiness = await createTestBusiness(
    "Business Location Integration Test Business",
  );

  businessAccountId = firstBusiness.businessAccountId;
  businessUserId = firstBusiness.businessUserId;

  const secondBusiness = await createTestBusiness(
    "Second Business Location Integration Test Business",
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

test("returns an unconfigured pickup location for a new business", async () => {
  const response = await fetch(
    `${baseUrl}/business-accounts/pickup-location`,
    {
      headers: authHeaders(),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, businessAccountId);
  assert.equal(body.data.pickupStreetAddress, null);
  assert.equal(body.data.pickupCity, null);
  assert.equal(body.data.pickupLatitude, null);
  assert.equal(body.data.pickupLongitude, null);
});

test("updates and retrieves the authenticated business pickup location", async () => {
  const response = await fetch(
    `${baseUrl}/business-accounts/pickup-location`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(validPickupLocation()),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(
    body.message,
    "Business pickup location updated successfully.",
  );
  assert.equal(body.data.id, businessAccountId);
  assert.equal(body.data.pickupStreetAddress, "15 Unity Road");
  assert.equal(body.data.pickupCity, "Ilorin");
  assert.equal(body.data.pickupState, "Kwara");
  assert.equal(body.data.pickupLandmark, "Near Central Market");
  assert.equal(Number(body.data.pickupLatitude), 8.4966);
  assert.equal(Number(body.data.pickupLongitude), 4.5421);

  const getResponse = await fetch(
    `${baseUrl}/business-accounts/pickup-location`,
    {
      headers: authHeaders(),
    },
  );

  const getBody = await getResponse.json();

  assert.equal(getResponse.status, 200);
  assert.equal(getBody.data.pickupStreetAddress, "15 Unity Road");
  assert.equal(getBody.data.pickupCity, "Ilorin");
});

test("rejects invalid pickup location data", async () => {
  const response = await fetch(
    `${baseUrl}/business-accounts/pickup-location`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(
        validPickupLocation({
          pickupLatitude: 91,
        }),
      ),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Invalid business pickup location data.",
  );
  assert.ok(body.errors.length > 0);
});

test("rejects a pickup location with missing required address fields", async () => {
  const response = await fetch(
    `${baseUrl}/business-accounts/pickup-location`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        pickupCity: "Ilorin",
        pickupState: "Kwara",
        pickupLatitude: 8.4966,
        pickupLongitude: 4.5421,
      }),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(body.errors.length > 0);
});

test("keeps pickup locations isolated between businesses", async () => {
  const response = await fetch(
    `${baseUrl}/business-accounts/pickup-location`,
    {
      headers: authHeaders(
        secondBusinessUserId,
        secondBusinessAccountId,
      ),
    },
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, secondBusinessAccountId);
  assert.equal(body.data.pickupStreetAddress, null);
  assert.equal(body.data.pickupLatitude, null);
  assert.equal(body.data.pickupLongitude, null);
});
